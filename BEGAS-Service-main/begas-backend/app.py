# 라이브러리 설정
import os
import io
import psycopg2
import pandas as pd
import numpy as np
import matplotlib
import json

from math import pi
from sklearn.linear_model import LinearRegression
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.single_table import CTGANSynthesizer
from sdv.single_table import TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from scipy.stats import ks_2samp

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib.collections import LineCollection

# Matplotlib 한글 폰트 설정
plt.rc("font", family="NanumGothic")

# Matplotlib 스타일 설정 (필요시 수정)
FIGSIZE = (12, 6)  # 그림 크기
TITLE_FONTSIZE = 16  # 제목 폰트 크기
LABEL_FONTSIZE = 12  # 축 라벨 폰트 크기
TICK_LABELSIZE = 10  # 눈금 라벨 폰트 크기
LEGEND_FONTSIZE = 12  # 범례 폰트 크기
FACE_COLOR = "#F8F9FA"  # 배경 색상

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
CORS(app)

# DB 연결
def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', '192.100.0.10'),
        port=int(os.environ.get('DB_PORT', 5432)),
        user=os.environ.get('DB_USER', 'tapp'),
        password=os.environ.get('DB_PASSWORD', '(tapp.123)'),
        database=os.environ.get('DB_NAME', 'svcfw')
    )

# 원화 포맷 함수
def format_won(value: float) -> str:
    return f"{value:,.2f}원"


# Flask 서버 설정
@app.route("/")
def index():
    return jsonify({"message": "Flask server is running."})


# DB 데이터 조회
@app.route("/dbdata")
def dbdata():
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    return jsonify(df.to_dict(orient="records"))


# 차트 데이터 조회
@app.route("/analysis-api")
def analysis_json():
    # 파라미터 파싱
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    try:
        start_date = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
        end_date = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")
    except Exception as e:
        return jsonify({"error": "날짜 형식 오류", "details": str(e)}), 400

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start_date) & (df["parsed"] <= end_date)]
    if st:
        df = df[df["ship_type"] == st]

    # 데이터 전처리
    df["month"] = df["parsed"].dt.strftime("%Y-%m")
    df["status"] = (
        df["delay_yn"]
        .fillna("")
        .str.strip()
        .map(lambda x: "Delay" if x in ["지연", "delay"] else "Normal")
    )

    # 월별 지연/정상 건수 집계
    group = df.groupby("month")["status"].value_counts().unstack(fill_value=0)
    labels = sorted(group.index)
    normal_counts = [int(group.loc[m].get("Normal", 0)) for m in labels]
    delay_counts = [int(group.loc[m].get("Delay", 0)) for m in labels]

    records = df.assign(month_str=df["month"])[
        ["trial_id", "month_str", "ship_type", "delay_yn"]
    ].to_dict(orient="records")

    return jsonify(
        {
            "labels": labels,
            "normal_counts": normal_counts,
            "delay_counts": delay_counts,
            "records": records,
        }
    )


# 차트 데이터 조회 (지연/정상)
@app.route("/analysis-api/chart")
def analysis_chart():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start_date = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end_date = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start_date) & (df["parsed"] <= end_date)]
    if st:
        df = df[df["ship_type"] == st]

    # 월별 지연/정상 건수 집계
    df["Month"] = df["parsed"].dt.strftime("%Y-%m")
    sc = df.groupby(["Month", "delay_yn"]).size().unstack(fill_value=0)
    nc = sc.get("정상", pd.Series(0, index=sc.index))
    dc = sc.get("지연", pd.Series(0, index=sc.index))
    labels = list(sc.index)

    # 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)
    ax.bar(labels, nc, label="Normal", color="#1ca392")
    ax.bar(labels, dc, bottom=nc, label="Delay", color="#ffc81b")

    ax.set_title(
        f'Monthly Normal/Delay Operations ({start_date:%Y-%m}~{end_date:%Y-%m}, {st or "전체"})',
        fontsize=TITLE_FONTSIZE,
    )
    ax.set_xlabel("Month", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel("Count", fontsize=LABEL_FONTSIZE)

    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(fontsize=LEGEND_FONTSIZE)

    plt.tight_layout()

    # 차트 이미지를 메모리에 저장하고 반환
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 비용 데이터 조회
@app.route("/analysis-api/cost-data")
def analysis_cost_data():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 비용 계산
    df["personnel_expense"] = df["captain_cost"] + df["helm_cost"] + df["labor_cost"]
    statuses = ["전체", "정상", "지연"]
    cost_types = [
        "fuel_cost",
        "helm_tot_cost",
        "labor_cost",
        "other_cost",
        "total_cost",
    ]

    # 비용 평균 계산
    out = []
    for status in statuses:
        sub = df if status == "전체" else df[df["delay_yn"] == status]
        avgs = sub[cost_types].mean() / 1_000_000
        row = {"status": status}
        for ct in cost_types:
            row[ct] = f"{avgs[ct]:.2f}"
        out.append(row)

    return jsonify(out)


# 비용 차트
@app.route("/analysis-api/cost-chart")
def analysis_cost_chart():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 비용 계산
    statuses = ["전체", "정상", "지연"]
    cost_types = [
        "fuel_cost",
        "helm_tot_cost",
        "labor_cost",
        "other_cost",
        "total_cost",
    ]
    labels = ["Fuel Cost", "Helm Tot Cost", "Labor Cost", "Other Cost", "Total Cost"]
    x = np.arange(len(labels))
    w = 0.25
    colors = {"전체": "#f15628", "정상": "#1ca392", "지연": "#ffc81b"}

    # 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    for i, status in enumerate(statuses):
        sub = df if status == "전체" else df[df["delay_yn"] == status]
        avgs = sub[cost_types].mean() / 1_000_000
        ax.bar(
            x + (i - 1) * w,
            avgs,
            w,
            label=status if status != "전체" else "Total",
            color=colors[status],
        )

    # 차트 제목 및 레이블 설정
    ax.set_title(
        f"Average Costs by Operation Status - {st or '전체'}", fontsize=TITLE_FONTSIZE
    )
    ax.set_ylabel("Cost (in millions)", fontsize=LABEL_FONTSIZE)

    ax.set_xticks(x)
    ax.set_xticklabels(labels, rotation=45, ha="right", fontsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    # 차트 이미지를 메모리에 저장하고 반환
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 비용 시계열 차트
@app.route("/analysis-api/cost-series")
def analysis_cost_series():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    ctype = request.args.get("type", "total")
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 비용 계산
    df["personnel_expense"] = df["captain_cost"] + df["helm_cost"] + df["labor_cost"]
    col_map = {
        "total": "total_cost",
        "personnel": "personnel_expense",
        "fuel": "fuel_cost",
    }
    col = col_map.get(ctype, "total_cost")

    # 월별 평균 비용 계산
    df["period"] = df["parsed"].dt.to_period("M")
    s_all = df.groupby("period")[col].mean()
    s_norm = df[df["delay_yn"] == "정상"].groupby("period")[col].mean()
    s_del = df[df["delay_yn"] == "지연"].groupby("period")[col].mean()

    x = [p.to_timestamp() for p in s_all.index]
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    ax.plot(x, s_all.values, label="Total", color="#f15628", linewidth=2)
    ax.plot(x, s_norm.values, label="Normal", color="#1ca392", linewidth=2)
    ax.plot(x, s_del.values, label="Delay", color="#ffc81b", linewidth=2)

    # 차트 제목 및 레이블 설정
    title_map = {"total": "Total Cost", "personnel": "Labor Cost", "fuel": "Fuel Cost"}
    ax.set_title(
        f"{title_map.get(ctype)} for {st or '전체'} ({start:%Y-%m}~{end:%Y-%m})",
        fontsize=TITLE_FONTSIZE,
    )
    ax.set_xlabel("Date", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel(title_map.get(ctype), fontsize=LABEL_FONTSIZE)

    ax.grid(True)
    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(loc="upper left", fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 인건비 예측
@app.route("/analysis-api/prediction/personnel")
def personnel_prediction_chart():
    # 파라미터 파싱 (기존 personnel_prediction과 동일)
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    df["parsed"] = (
        df["trial_date"]
        .str.strip()
        .apply(
            lambda s: (
                datetime.strptime(s, "%Y년 %m월") if isinstance(s, str) else pd.NaT
            )
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 인건비 계산 & 모델 학습
    df["personnel_expense"] = df["captain_cost"] + df["helm_cost"] + df["labor_cost"]
    grp = (
        df.groupby(df["parsed"].dt.to_period("M"))
        .agg({"personnel_expense": "mean"})
        .reset_index()
    )
    grp["date"] = grp["parsed"].dt.to_timestamp()

    # 과거(actual)
    actual_dates = grp["date"]
    actual_values = grp["personnel_expense"]

    # 예측(predicted)
    X = grp["date"].map(lambda d: d.toordinal()).values.reshape(-1, 1)
    y = grp["personnel_expense"].values
    model = LinearRegression().fit(X, y)
    future_dates = pd.date_range(
        start=actual_dates.max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    fut_ordinals = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    pred_values = model.predict(fut_ordinals)

    # Matplotlib 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    ax.plot(actual_dates, actual_values, label="Actual", color="blue", linewidth=2)
    ax.plot(
        future_dates,
        pred_values,
        label="Predicted",
        color="red",
        linestyle="--",
        linewidth=2,
    )

    ax.set_title(
        f"인건비 예측 ({start:%Y-%m}~2025-12)",
        fontname="Malgun Gothic",
        fontsize=TITLE_FONTSIZE,
    )
    ax.set_xlabel("Date", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel("Cost", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)

    ax.grid(True)
    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(loc="upper left", fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    # 차트 이미지를 메모리에 저장하고 반환
    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=False)
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 인건비 예측 데이터(테이블 용)
@app.route("/analysis-api/prediction/personnel-data")
def personnel_prediction_data():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 & 전처리 (차트 코드와 동일)
    conn = get_db_connection()  
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    df["parsed"] = (
        df["trial_date"]
        .str.strip()
        .apply(
            lambda s: (
                datetime.strptime(s, "%Y년 %m월") if isinstance(s, str) else pd.NaT
            )
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 인건비 집계 & 예측 (차트 코드와 동일)
    df["personnel_expense"] = df["captain_cost"] + df["helm_cost"] + df["labor_cost"]
    grp = (
        df.groupby(df["parsed"].dt.to_period("M"))
        .agg({"personnel_expense": "mean"})
        .reset_index()
    )
    grp["date"] = grp["parsed"].dt.to_timestamp()

    # 과거(actual) / 예측(predicted) 값 준비
    actual = [ 
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(grp["date"], grp["personnel_expense"])
    ]
    # 선형회귀 모델
    X = grp["date"].map(lambda d: d.toordinal()).values.reshape(-1, 1)
    y = grp["personnel_expense"].values
    model = LinearRegression().fit(X, y)
    future_dates = pd.date_range(
        start=grp["date"].max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    fut_ord = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    preds = model.predict(fut_ord)
    predicted = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(future_dates, preds)
    ]
    predicted_2025 = [p for p in predicted if p["date"].startswith("2025")]

    return jsonify(
        {"actual": actual, "predicted": predicted, "predicted_2025": predicted_2025}
    )


# 기타비용 예측
@app.route("/analysis-api/prediction/other")
def other_prediction():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 기타비용 계산 & 모델 학습
    grp = (
        df.groupby(df["parsed"].dt.to_period("M"))
        .agg({"other_cost": "mean"})
        .reset_index()
    )
    grp["parsed"] = grp["parsed"].dt.to_timestamp()
    grp["date"] = grp["parsed"]
    grp["ordinal"] = grp["parsed"].map(lambda x: x.toordinal())

    actual_dates = grp["date"]
    actual_values = grp["other_cost"]

    # 예측(predicted)
    X = grp["ordinal"].values.reshape(-1, 1)
    y = grp["other_cost"].values

    # 선형회귀 모델
    model = LinearRegression().fit(X, y)
    future_dates = pd.date_range(
        start=actual_dates.max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    fut_ordinals = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    pred_values = model.predict(fut_ordinals)

    # Matplotlib 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    ax.plot(actual_dates, actual_values, label="Actual", color="blue", linewidth=2)
    ax.plot(
        future_dates,
        pred_values,
        label="Predicted",
        color="red",
        linestyle="--",
        linewidth=2,
    )

    # 차트 제목 및 레이블 설정
    ax.set_title(
        f"기타 비용 예측 ({start:%Y-%m}~2025-12)",
        fontname="Malgun Gothic",
        fontsize=TITLE_FONTSIZE,
    )
    ax.set_xlabel("Date", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel("Cost", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)

    ax.grid(True)
    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(loc="upper left", fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=False)
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 기타비용 예측 데이터(테이블 용)
@app.route("/analysis-api/prediction/other-data")
def other_prediction_data():
    # 파라미터 파싱
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    df["parsed"] = (
        df["trial_date"]
        .str.strip()
        .apply(
            lambda s: (
                datetime.strptime(s, "%Y년 %m월") if isinstance(s, str) else pd.NaT
            )
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 기타비용 계산 & 모델 학습
    grp = (
        df.groupby(df["parsed"].dt.to_period("M"))
        .agg({"other_cost": "mean"})
        .reset_index()
    )
    grp["parsed"] = grp["parsed"].dt.to_timestamp()
    grp["date"] = grp["parsed"]
    grp["ordinal"] = grp["parsed"].map(lambda x: x.toordinal())

    # 과거(actual) / 예측(predicted) 값 준비
    actual = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(grp["date"], grp["other_cost"])
    ]

    # 선형회귀 모델
    X = grp["ordinal"].values.reshape(-1, 1)
    y = grp["other_cost"].values
    model = LinearRegression().fit(X, y)
    future_dates = pd.date_range(
        start=grp["date"].max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    fut_ord = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    preds = model.predict(fut_ord)

    predicted = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(future_dates, preds)
    ]
    predicted_2025 = [p for p in predicted if p["date"].startswith("2025")]

    return jsonify(
        {"actual": actual, "predicted": predicted, "predicted_2025": predicted_2025}
    )


# 유류비 예측
@app.route("/analysis-api/prediction/fuel")
def fuel_prediction_chart():
    # 파라미터 파싱은 위와 동일
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    df["parsed"] = (
        df["trial_date"]
        .str.strip()
        .apply(
            lambda s: (
                datetime.strptime(s, "%Y년 %m월") if isinstance(s, str) else pd.NaT
            )
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 월별 평균 연료비 계산
    df["fuel_cost"] = df["fuel_cost"].astype(float)
    hist = df.groupby(df["parsed"].dt.to_period("M"))["fuel_cost"].mean().reset_index()
    hist["date"] = hist["parsed"].dt.to_timestamp()

    # 미래 예측 (선형회귀)
    X_hist = hist["date"].map(lambda d: d.toordinal()).values.reshape(-1, 1)
    y_hist = hist["fuel_cost"].values
    model = LinearRegression().fit(X_hist, y_hist)
    future_dates = pd.date_range(
        start=hist["date"].max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    X_fut = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    preds = model.predict(X_fut)

    # 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    ax.plot(hist["date"], hist["fuel_cost"], label="Actual", color="blue", linewidth=2)
    ax.plot(
        future_dates, preds, label="Predicted", color="red", linestyle="--", linewidth=2
    )

    # 차트 제목 및 레이블 설정
    ax.set_title(
        f"유류비 일별 예측 ({start:%Y-%m}~2025-12)",
        fontname="Malgun Gothic",
        fontsize=TITLE_FONTSIZE,
    )
    ax.set_xlabel("Date", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel("Fuel Cost", fontname="Malgun Gothic", fontsize=LABEL_FONTSIZE)

    ax.grid(True)
    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.legend(loc="upper left", fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", transparent=False)
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 유류비 예측 데이터(테이블 용)
@app.route("/analysis-api/prediction/fuel-data")
def fuel_prediction_data():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리 (차트 코드와 동일)
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 & 필터링
    df["parsed"] = (
        df["trial_date"]
        .str.strip()
        .apply(
            lambda s: (
                datetime.strptime(s, "%Y년 %m월") if isinstance(s, str) else pd.NaT
            )
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 월별 평균 연료비 계산
    df["fuel_cost"] = df["fuel_cost"].astype(float)
    hist = df.groupby(df["parsed"].dt.to_period("M"))["fuel_cost"].mean().reset_index()
    hist["date"] = hist["parsed"].dt.to_timestamp()

    # 미래 예측 (선형회귀)
    X_hist = hist["date"].map(lambda d: d.toordinal()).values.reshape(-1, 1)
    y_hist = hist["fuel_cost"].values
    model = LinearRegression().fit(X_hist, y_hist)
    future_dates = pd.date_range(
        start=hist["date"].max() + pd.DateOffset(months=1),
        end=datetime(2025, 12, 1),
        freq="MS",
    )
    X_fut = future_dates.map(lambda d: d.toordinal()).values.reshape(-1, 1)
    preds = model.predict(X_fut)

    actual = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(hist["date"], hist["fuel_cost"])
    ]
    predicted = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(future_dates, preds)
    ]
    predicted_2025 = [p for p in predicted if p["date"].startswith("2025")]

    return jsonify(
        {"actual": actual, "predicted": predicted, "predicted_2025": predicted_2025}
    )


# 유류비 예측 차트
@app.route("/analysis-api/fuel-price-chart")
def analysis_fuel_price_chart():
    conn = get_db_connection()
    df = pd.read_sql(
        """
        SELECT year, month, hfo_unit_price, mfo_unit_price
        FROM begas.fuel_costs_by_year
    """,
        conn,
    )
    conn.close()

    # 데이터 전처리
    df["Date"] = pd.to_datetime(
        df["year"].astype(str) + df["month"].astype(str), format="%Y%B"
    )
    df["Date_ordinal"] = df["Date"].map(lambda x: x.toordinal())

    hfo_m = LinearRegression().fit(df[["Date_ordinal"]], df["hfo_unit_price"])
    mfo_m = LinearRegression().fit(df[["Date_ordinal"]], df["mfo_unit_price"])

    # 미래 예측
    last = df["Date"].max()
    future = pd.DataFrame(
        {
            "Date": pd.date_range(
                start=last + pd.DateOffset(months=1), end="2025-12-01", freq="MS"
            )
        }
    )
    future["Date_ordinal"] = future["Date"].map(lambda x: x.toordinal())
    future["hfo"] = hfo_m.predict(future[["Date_ordinal"]])
    future["mfo"] = mfo_m.predict(future[["Date_ordinal"]])

    # 과거(actual) / 예측(predicted) 값 준비
    combined_hfo = pd.concat(
        [
            df.rename(columns={"hfo_unit_price": "value"})[["Date", "value"]],
            future.rename(columns={"hfo": "value"})[["Date", "value"]],
        ],
        ignore_index=True,
    ).sort_values("Date")
    combined_mfo = pd.concat(
        [
            df.rename(columns={"mfo_unit_price": "value"})[["Date", "value"]],
            future.rename(columns={"mfo": "value"})[["Date", "value"]],
        ],
        ignore_index=True,
    ).sort_values("Date")

    # Matplotlib 차트 그리기
    fig, ax = plt.subplots(figsize=(8, 4))
    ax.set_facecolor("#F8F9FA")
    ax.plot(combined_hfo["Date"], combined_hfo["value"], label="HFO", color="blue")
    ax.plot(combined_mfo["Date"], combined_mfo["value"], label="MFO", color="green")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    plt.xticks(rotation=45)
    ax.legend()
    ax.set_title("HFO & MFO 단가 예측")
    ax.set_xlabel("Date")
    ax.set_ylabel("Cost (100L)")
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 환율 예측
@app.route("/analysis-api/exchange-rate-chart")
def analysis_exchange_rate_chart():
    conn = get_db_connection()
    df = pd.read_sql(
        """
        SELECT year, month, won_dollar_exchg AS dollar, won_euro_exchg AS euro
        FROM begas.exchange_rates_by_year
    """,
        conn,
    )
    conn.close()

    # 데이터 전처리
    df["Date"] = pd.to_datetime(
        df["year"].astype(str) + df["month"].astype(str), format="%Y%B"
    )
    df["Date_ordinal"] = df["Date"].map(lambda x: x.toordinal())

    # 선형회귀 모델 학습
    d_m = LinearRegression().fit(df[["Date_ordinal"]], df["dollar"])
    e_m = LinearRegression().fit(df[["Date_ordinal"]], df["euro"])

    # 미래 예측
    last = df["Date"].max()
    future = pd.DataFrame(
        {
            "Date": pd.date_range(
                start=last + pd.DateOffset(months=1), end="2025-12-01", freq="MS"
            )
        }
    )
    future["Date_ordinal"] = future["Date"].map(lambda x: x.toordinal())
    future["dollar"] = d_m.predict(future[["Date_ordinal"]])
    future["euro"] = e_m.predict(future[["Date_ordinal"]])

    # 과거(actual) / 예측(predicted) 값 준비
    combined_usd = pd.concat(
        [
            df.rename(columns={"dollar": "value"})[["Date", "value"]],
            future.rename(columns={"dollar": "value"})[["Date", "value"]],
        ],
        ignore_index=True,
    ).sort_values("Date")
    combined_eur = pd.concat(
        [
            df.rename(columns={"euro": "value"})[["Date", "value"]],
            future.rename(columns={"euro": "value"})[["Date", "value"]],
        ],
        ignore_index=True,
    ).sort_values("Date")

    # Matplotlib 차트 그리기
    fig, ax = plt.subplots(figsize=FIGSIZE)
    ax.set_facecolor(FACE_COLOR)

    ax.plot(
        combined_usd["Date"], combined_usd["value"], "-o", label="USD/KRW", linewidth=2
    )
    ax.plot(
        combined_eur["Date"], combined_eur["value"], "-o", label="EUR/KRW", linewidth=2
    )

    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m"))
    ax.tick_params(axis="x", rotation=45, labelsize=TICK_LABELSIZE)
    ax.tick_params(axis="y", labelsize=TICK_LABELSIZE)

    ax.set_title("환율 예측", fontsize=TITLE_FONTSIZE)
    ax.set_xlabel("Date", fontsize=LABEL_FONTSIZE)
    ax.set_ylabel("Rate", fontsize=LABEL_FONTSIZE)

    ax.legend(fontsize=LEGEND_FONTSIZE)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")


# 총 경비 예측
@app.route("/analysis-api/prediction/total")
def total_prediction():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB 로드 및 전처리
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱 및 필터링
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 월별 평균 total_cost 계산
    df["period"] = df["parsed"].dt.to_period("M")
    grp = df.groupby("period")["total_cost"].mean().reset_index()
    grp["parsed"] = grp["period"].dt.to_timestamp()
    grp["ordinal"] = grp["parsed"].map(lambda x: x.toordinal())

    # 모델 학습
    X = grp[["ordinal"]].values
    y = grp["total_cost"].values
    model = LinearRegression().fit(X, y)

    # 과거(actual)
    actual = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(grp["parsed"], grp["total_cost"])
    ]

    # 미래 예측
    last_date = grp["parsed"].max()
    future_dates = pd.date_range(
        start=last_date + pd.DateOffset(months=1), end=datetime(2025, 12, 1), freq="MS"
    )
    fut = pd.DataFrame({"parsed": future_dates})
    fut["ordinal"] = fut["parsed"].map(lambda x: x.toordinal())
    fut["prediction"] = model.predict(fut[["ordinal"]])

    # 예측(predicted)
    predicted = [
        {"date": d.strftime("%Y-%m"), "value": format_won(v)}
        for d, v in zip(fut["parsed"], fut["prediction"])
    ]
    predicted_2025 = [p for p in predicted if p["date"].startswith("2025")]

    return jsonify(
        {"actual": actual, "predicted": predicted, "predicted_2025": predicted_2025}
    )


# 원인 분석
@app.route("/analysis-api/cause")
def cause_analysis():
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    st = request.args.get("ship_type", None)
    month = int(request.args.get("month", "01"))
    start_date = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")

    # 데이터 로드
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()

    # 날짜 파싱
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    if st:
        df = df[df["ship_type"] == st]

    # 12024년 월별 평균
    df_2024 = df[df["parsed"].dt.year == 2024]
    avg_2024_labor = (
        df_2024["captain_cost"]
        .add(df_2024["helm_cost"])
        .add(df_2024["labor_cost"])
        .mean()
        if not df_2024.empty
        else None
    )
    avg_2024_other = df_2024["other_cost"].mean() if not df_2024.empty else None
    avg_2024_fuel = df_2024["fuel_cost"].mean() if not df_2024.empty else None

    # 2025 예측값 추출 (해당 월) - 인건비 예측
    df_pe = df.copy()
    df_pe["personnel_expense"] = (
        df_pe["captain_cost"] + df_pe["helm_cost"] + df_pe["labor_cost"]
    )
    grp_pe = (
        df_pe.groupby(df_pe["parsed"].dt.to_period("M"))
        .agg({"personnel_expense": "mean"})
        .reset_index()
    )
    grp_pe["parsed"] = grp_pe["parsed"].dt.to_timestamp()
    grp_pe["ord"] = grp_pe["parsed"].map(lambda x: x.toordinal())
    model_pe = LinearRegression().fit(grp_pe[["ord"]], grp_pe["personnel_expense"])
    last_pe = grp_pe["parsed"].max()
    fut_pe_dates = pd.date_range(
        start=last_pe + pd.DateOffset(months=1), end="2025-12-01", freq="MS"
    )
    fut_pe = pd.DataFrame({"parsed": fut_pe_dates})
    fut_pe["ord"] = fut_pe["parsed"].map(lambda x: x.toordinal())
    fut_pe["pred"] = model_pe.predict(fut_pe[["ord"]])
    lab_2025 = (
        fut_pe[fut_pe["parsed"].dt.month == month]["pred"].iloc[0]
        if not fut_pe.empty
        else None
    )

    # 기타비용 예측
    grp_ot = (
        df.groupby(df["parsed"].dt.to_period("M"))
        .agg({"other_cost": "mean"})
        .reset_index()
    )
    grp_ot["parsed"] = grp_ot["parsed"].dt.to_timestamp()
    grp_ot["ord"] = grp_ot["parsed"].map(lambda x: x.toordinal())
    model_ot = LinearRegression().fit(grp_ot[["ord"]], grp_ot["other_cost"])
    last_ot = grp_ot["parsed"].max()
    fut_ot = pd.DataFrame(
        {
            "parsed": pd.date_range(
                start=last_ot + pd.DateOffset(months=1), end="2025-12-01", freq="MS"
            )
        }
    )
    fut_ot["ord"] = fut_ot["parsed"].map(lambda x: x.toordinal())
    fut_ot["pred"] = model_ot.predict(fut_ot[["ord"]])
    oth_2025 = (
        fut_ot[fut_ot["parsed"].dt.month == month]["pred"].iloc[0]
        if not fut_ot.empty
        else None
    )

    # 유류비 예측
    df_fu = df.copy()
    df_fu["trial_days"] = df_fu["parsed"].dt.days_in_month
    df_fu["fuel_cost"] = df_fu["fuel_cost"].astype(float)
    grp_fu = (
        df_fu.groupby(df_fu["parsed"].dt.to_period("M"))
        .agg({"fuel_cost": "mean"})
        .reset_index()
    )
    grp_fu["parsed"] = grp_fu["parsed"].dt.to_timestamp()
    grp_fu["ord"] = grp_fu["parsed"].map(lambda x: x.toordinal())
    model_fu = LinearRegression().fit(grp_fu[["ord"]], grp_fu["fuel_cost"])
    last_fu = grp_fu["parsed"].max()
    fut_fu = pd.DataFrame(
        {
            "parsed": pd.date_range(
                start=last_fu + pd.DateOffset(months=1), end="2025-12-01", freq="MS"
            )
        }
    )
    fut_fu["ord"] = fut_fu["parsed"].map(lambda x: x.toordinal())
    fut_fu["pred"] = model_fu.predict(fut_fu[["ord"]])
    fuel_2025 = (
        fut_fu[fut_fu["parsed"].dt.month == month]["pred"].iloc[0]
        if not fut_fu.empty
        else None
    )

    # 상승률
    def pct(new, old):
        return (new - old) / old * 100 if old and new is not None else None

    pr_lab = pct(lab_2025, avg_2024_labor)
    pr_oth = pct(oth_2025, avg_2024_other)
    pr_fu = pct(fuel_2025, avg_2024_fuel)

    # 테이블 및 최고 변동 항목
    table = [
        {
            "item": "인건비",
            "avg_2024": round(avg_2024_labor or 0, 2),
            "pred_2025": round(lab_2025 or 0, 2),
            "rate": round(pr_lab or 0, 2),
        },
        {
            "item": "기타비용",
            "avg_2024": round(avg_2024_other or 0, 2),
            "pred_2025": round(oth_2025 or 0, 2),
            "rate": round(pr_oth or 0, 2),
        },
        {
            "item": "유류비",
            "avg_2024": round(avg_2024_fuel or 0, 2),
            "pred_2025": round(fuel_2025 or 0, 2),
            "rate": round(pr_fu or 0, 2),
        },
    ]
    max_row = max(table, key=lambda r: abs(r["rate"]))
    max_text = f"{max_row['item']}이(가) {abs(max_row['rate']):.2f}%로 가장 큰 변동을 보였습니다."

    return jsonify({"table": table, "maxText": max_text})


# 비용 레이더 차트
@app.route("/analysis-api/cost-radar-chart")
def analysis_cost_radar_chart():
    # 파라미터 파싱
    sy, sm = request.args.get("start_year", "2015"), request.args.get(
        "start_month", "01"
    )
    ey, em = request.args.get("end_year", "2024"), request.args.get("end_month", "01")
    st = request.args.get("ship_type", None)
    start = datetime.strptime(f"{sy}-{sm}-01", "%Y-%m-%d")
    end = datetime.strptime(f"{ey}-{em}-01", "%Y-%m-%d")

    # DB에서 데이터 로드 & 필터링
    conn = get_db_connection()
    df = pd.read_sql("SELECT * FROM begas.pre_test_fin", conn)
    conn.close()
    df["parsed"] = df["trial_date"].apply(
        lambda s: (
            datetime.strptime(s.strip(), "%Y년 %m월") if isinstance(s, str) else pd.NaT
        )
    )
    df = df.dropna(subset=["parsed"])
    df = df[(df["parsed"] >= start) & (df["parsed"] <= end)]
    if st:
        df = df[df["ship_type"] == st]

    # 비용 컬럼 매핑
    cost_cols = ["fuel_cost", "labor_cost", "total_cost", "other_cost", "helm_tot_cost"]
    df[cost_cols] = df[cost_cols].astype(float)

    # 정상/지연 평균 계산
    normal = df[df["delay_yn"] == "정상"]
    delayed = df[df["delay_yn"] == "지연"]
    total_avg = df[cost_cols].mean()
    normal_avg = normal[cost_cols].mean()
    delayed_avg = delayed[cost_cols].mean()

    # 비율 계산 (Total:100, Normal:90%, Delay:110% 스케일)
    labels = [
        ("Fuel Cost", "fuel_cost"),
        ("Labor Cost", "labor_cost"),
        ("Total Cost", "total_cost"),
        ("Other Cost", "other_cost"),
        ("Helm Tot Cost", "helm_tot_cost"),
    ]
    ratios = {}
    for lbl, col in labels:
        ratios[lbl] = {
            "Total": 100,
            "Normal": (normal_avg[col] / total_avg[col]) * 90,
            "Delay": (delayed_avg[col] / total_avg[col]) * 110,
        }

    # 레이더 차트 그리기
    categories = [lbl for lbl, _ in labels]
    N = len(categories)
    angles = [n / float(N) * 2 * pi for n in range(N)]
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(5, 5), subplot_kw=dict(polar=True))
    fig.patch.set_facecolor("#ebf1f1")
    ax.set_theta_offset(pi / 2)
    ax.set_theta_direction(-1)
    plt.xticks(angles[:-1], categories, fontsize=8)
    ax.set_rlabel_position(0)
    plt.yticks([60, 80, 100, 125], ["60%", "80%", "100%", "125%"], color="grey", size=7)
    plt.ylim(60, 125)

    # 각 항목별 레이더 차트 그리기
    vals = [ratios[c]["Total"] for c in categories]
    vals += vals[:1]
    ax.plot(angles, vals, linestyle="solid", label="Total", color="#f15628")
    ax.fill(angles, vals, alpha=0.1, color="#f15628")
    # Normal
    vals = [ratios[c]["Normal"] for c in categories]
    vals += vals[:1]
    ax.plot(angles, vals, linestyle="solid", label="Normal", color="#1ca392")
    ax.fill(angles, vals, alpha=0.1, color="#1ca392")
    # Delay
    vals = [ratios[c]["Delay"] for c in categories]
    vals += vals[:1]
    ax.plot(angles, vals, linestyle="solid", label="Delay", color="#ffc81b")
    ax.fill(angles, vals, alpha=0.1, color="#ffc81b")

    plt.legend(loc="upper right", bbox_to_anchor=(1.2, 1.1), fontsize=8)
    plt.title("Radar Chart by Cost", y=1.1)

    # 7) 버퍼에 저장해서 반환
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    plt.close(fig)
    return send_file(buf, mimetype="image/png")

# CSV 업로드 받기
@app.route('/synth-data/upload', methods=['POST'])
def synth_data_upload():
    if 'file' not in request.files:
        return jsonify({'error': '파일이 없습니다.'}), 400

    try:
        file = request.files['file']
        df = pd.read_csv(io.BytesIO(file.read()), encoding='utf-8-sig')

        schema_json = request.form.get('schema')
        if schema_json:
            try:
                schema = json.loads(schema_json)
                for col, meta in schema.items():
                    if not meta.get('include', True):
                        df.drop(columns=[col], inplace=True, errors='ignore')
                    else:
                        selected_type = meta.get('selectedType')
                        if selected_type == 'Categorical':
                            df[col] = df[col].astype(str)
                        elif selected_type == 'Continuous':
                            df[col] = pd.to_numeric(df[col], errors='coerce')
            except json.JSONDecodeError:
                return jsonify({'error': 'schema 파싱 실패'}), 400

        records = df.to_dict(orient='records')
        return jsonify({'columns': df.columns.tolist(), 'records': records})

    except Exception as e:
        return jsonify({'error': 'CSV 처리 중 오류', 'details': str(e)}), 500

# 샘플 데이터 생성
@app.route('/synth-data/sample', methods=['POST'])
def generate_sample():
    try:
        records_json = request.form.get('records')
        schema_json = request.form.get('schema')
        n_rows = int(request.form.get('n_rows', 10))
        algorithm = request.form.get('algorithm', 'Copula')

        if not records_json or not schema_json: 
            return jsonify({'error': 'records 또는 schema 누락'}), 400

        records = json.loads(records_json)
        schema = json.loads(schema_json)

        included_cols = [col for col, meta in schema.items() if meta.get('include', True)]
        df = pd.DataFrame([{col: row.get(col, None) for col in included_cols} for row in records])

        for col in included_cols:
            selected_type = schema[col].get('selectedType') or schema[col].get('inferredType')
            if selected_type == 'Categorical':
                df[col] = df[col].astype(str)
            elif selected_type == 'Continuous':
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # SDV 메타데이터 설정
        metadata = SingleTableMetadata()
        metadata.detect_from_dataframe(df)

        if algorithm == 'Copula':
            from sdv.single_table import GaussianCopulaSynthesizer
            model = GaussianCopulaSynthesizer(metadata)
        elif algorithm == 'CTGAN':
            from sdv.single_table import CTGANSynthesizer
            model = CTGANSynthesizer(metadata)
        elif algorithm == 'TVAE' : 
            from sdv.single_table import TVAESynthesizer
            model = TVAESynthesizer(metadata)
        else:
            return jsonify({'error': '지원되지 않는 알고리즘'}), 400

        model.fit(df)
        samples = model.sample(n_rows).fillna('')
        return jsonify(samples.to_dict(orient='records'))

    except Exception as e:
        return jsonify({'error': '샘플 생성 실패', 'details': str(e)}), 500

# 통계 비교
@app.route('/synth-data/statistics', methods=['POST'])
def generate_statistics():
    try:
        data = request.get_json()
        original = pd.DataFrame(data['original'])
        synthetic = pd.DataFrame(data['synthetic'])
        schema = data['schema']

        stats_result = {}
        for col, meta in schema.items():
            if not meta.get('include', True):
                continue
            dtype = meta.get('selectedType') or meta.get('inferredType')
            if dtype != 'Continuous':
                continue

            orig_col = pd.to_numeric(original[col], errors='coerce').dropna()
            synth_col = pd.to_numeric(synthetic[col], errors='coerce').dropna()

            if orig_col.empty or synth_col.empty:
                continue  # 유효한 값이 없으면 건너뜀

            stats_result[col] = {
                'mean_orig': float(orig_col.mean()),
                'mean_synth': float(synth_col.mean()),
                'std_orig': float(orig_col.std()),
                'std_synth': float(synth_col.std()),
                'min_orig': float(orig_col.min()),
                'min_synth': float(synth_col.min()),
                'max_orig': float(orig_col.max()),
                'max_synth': float(synth_col.max()),
                'iqr_orig': float(orig_col.quantile(0.75) - orig_col.quantile(0.25)),
                'iqr_synth': float(synth_col.quantile(0.75) - synth_col.quantile(0.25)),
                'p_value': float(ks_2samp(orig_col, synth_col).pvalue)
            }

        return jsonify({'statistics': stats_result})

    except Exception as e:
        return jsonify({'error': '통계 생성 실패', 'details': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4850)