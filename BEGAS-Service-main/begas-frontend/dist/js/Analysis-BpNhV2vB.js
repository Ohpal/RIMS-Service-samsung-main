import { importShared } from "./__federation_fn_import-Dc6jQS63.js";
import { C as Chart, r as registerables, a as axios } from "./chart-BSp4ASw0.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
Chart.register(...registerables);
function simpleLinearRegression(x, y) {
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b) / n;
  const yMean = y.reduce((a, b) => a + b) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = num / den;
  const intercept = yMean - slope * xMean;
  return {
    predict: (xVal) => slope * xVal + intercept,
    slope,
    intercept
  };
}
const _sfc_main = {
  name: "Analysis",
  data() {
    return {
      columns: [],
      fieldSchema: {},
      itemOptions: ["Fuel Cost", "Helm Tot Cost", "Labor Cost", "Other Cost"],
      saveMessage: "",
      loading: true,
      uploadedFile: null,
      uploadPreviewColumns: [],
      uploadPreviewRecords: [],
      uploadCurrentPage: 1,
      uploadPageSize: 10,
      monthlyTablePage: 0,
      monthlyTablePageSize: 10,
      showFieldSchemaSaveModal: false,
      fieldSchemaUserName: "",
      fieldSchemaTableName: "",
      fieldSchemaSaveMessage: "",
      selectedFieldsForAnalysis: [],
      csvLoaded: false,
      filterApplied: false,
      years: [],
      months: [],
      showDbSaveModal: false,
      dbTableName: "",
      dbUserName: "",
      dbSaveMessage: "",
      shipTypes: [],
      fieldDisplayToKeyMap: { "Fuel Cost": "fuel_cost", "Helm Tot Cost": "helm_tot_cost", "Labor Cost": "labor_cost", "Other Cost": "other_cost" },
      rawPage: 0,
      pageSize: 10,
      filters: { start_year: "", start_month: "", end_year: "", end_month: "", ship_type: "", hull_number: "" },
      hullMapping: {},
      fieldSchemaSaved: false,
      fieldSchemaError: "",
      compareFilters: { ship_type: "", hull_number: "" },
      translationDict: {
        "1차_1차선": "1st_1st",
        "2차_1차선": "2nd_1st",
        "1차선": "1st",
        "시리즈": "Series"
      },
      baseColumns: ["delay_yn", "hull_number", "month_str", "ship_type", "trial_id"],
      selectedColumns: [],
      otherChart: null,
      fuelChart: null,
      costChart: null,
      personnelChart: null,
      totalCostPredChart: null,
      causeSummary: { items: [], maxItem: { label: "", dir: "up", rateAbs: "0.00" }, total: { from: "0", to: "0", dir: "up", rateAbs: "0.00" } },
      maxDetail: { label: "", from: "", to: "", rateAbs: "0.00", dir: "up" },
      totalMentLine: "",
      predictedPersonnelTable: [],
      predictedOtherTable: [],
      predictedFuelTable: [],
      predictedTotalTable: [],
      costRadarChart: null,
      selectedMonth: "",
      causeTable: [],
      maxChangeText: ""
    };
  },
  watch: {
    "filters.ship_type"(nv) {
      this.filters.hull_number = "";
    }
  },
  computed: {
    uploadPagedRecords() {
      if (!Array.isArray(this.uploadPreviewRecords)) return [];
      const start = (this.uploadCurrentPage - 1) * this.uploadPageSize;
      return this.uploadPreviewRecords.slice(start, start + this.uploadPageSize);
    },
    filteredHullNumbers() {
      return this.hullMapping[this.filters.ship_type] || [];
    },
    compareFilteredHullNumbers() {
      return this.hullMapping[this.compareFilters.ship_type] || [];
    },
    filteredRecords() {
      return this.uploadPreviewRecords.filter((row) => {
        var _a, _b, _c, _d, _e, _f;
        let y = (_c = (_b = (_a = row.month_str) == null ? void 0 : _a.split) == null ? void 0 : _b.call(_a, "-")) == null ? void 0 : _c[0];
        let m = (_f = (_e = (_d = row.month_str) == null ? void 0 : _d.split) == null ? void 0 : _e.call(_d, "-")) == null ? void 0 : _f[1];
        if ((!y || !m) && row.trial_date) {
          const mm = String(row.trial_date).match(/(\d{4})년\s*(\d{1,2})월/);
          if (mm) {
            y = mm[1];
            m = mm[2].padStart(2, "0");
          }
        }
        if (!y || !m) return false;
        const ym = Number(y) * 100 + Number(m);
        const start = Number(this.filters.start_year) * 100 + Number(this.filters.start_month);
        const end = Number(this.filters.end_year) * 100 + Number(this.filters.end_month);
        const shipOk = this.filters.ship_type ? row.ship_type === this.filters.ship_type : true;
        const hullOk = this.filters.hull_number ? row.hull_number === this.filters.hull_number : true;
        return ym >= start && ym <= end && shipOk && hullOk;
      });
    },
    // 월별 시운전 횟수 데이터
    monthlyTableData() {
      const byMonth = {};
      let records = this.filteredRecords;
      if (records.length > 0 && typeof records[0] === "string") {
        try {
          records = records.map((x) => JSON.parse(x));
        } catch (e) {
          return [];
        }
      }
      records.forEach((row) => {
        let month = row.month_str;
        if (!month && row.trial_date) {
          const m_ = row.trial_date.match(/(\d{4})년\s*(\d{1,2})월/);
          if (m_) {
            month = `${m_[1]}-${m_[2].padStart(2, "0")}`;
          }
        }
        if (!month) return;
        if (!byMonth[month]) byMonth[month] = { month, normal: 0, delay: 0, total: 0 };
        if (row.delay_yn === "Y" || row.delay_yn === 1 || row.delay_yn === "1" || row.delay_yn === "지연") {
          byMonth[month].delay += 1;
        } else {
          byMonth[month].normal += 1;
        }
        byMonth[month].total += 1;
      });
      return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
    },
    // 페이지네이션을 위한 데이터
    pagedRecords() {
      const start = (this.rawPage || 0) * this.pageSize;
      return this.filteredRecords.slice(start, start + this.pageSize);
    },
    // 전체 페이지 수
    totalPages() {
      return Math.ceil(this.filteredRecords.length / this.pageSize);
    },
    // 필터링된 레코드의 카운트 요약
    countSummaryData() {
      const normal = this.filteredRecords.filter(
        (r) => r.delay_yn === "정상" || r.delay_yn === "N" || r.delay_yn === 0 || r.delay_yn === "0"
      ).length;
      const delayRows = this.filteredRecords.filter(
        (r) => r.delay_yn === "지연" || r.delay_yn === "Y" || r.delay_yn === 1 || r.delay_yn === "1"
      );
      const delay = delayRows.length;
      let delayTime = delayRows.reduce((sum, r) => {
        let val = r.delay_time;
        if (typeof val === "string" && val.match(/^\d+$/)) val = parseInt(val, 10);
        if (typeof val === "number" && !isNaN(val)) return sum + val;
        return sum;
      }, 0);
      return [
        { status: "Normal", count: normal, time: "" },
        { status: "Delay", count: delay, time: delayTime ? `${delayTime} 시간` : "" },
        { status: "Total", count: normal + delay, time: "" }
      ];
    },
    // 월별 시운전 횟수 테이블 데이터
    pagedMonthlyTableData() {
      const start = this.monthlyTablePage * this.monthlyTablePageSize;
      return this.monthlyTableData.slice(start, start + this.monthlyTablePageSize);
    },
    // 월별 시운전 횟수 테이블 전체 페이지 수
    totalMonthlyTablePages() {
      return Math.ceil(this.monthlyTableData.length / this.monthlyTablePageSize) || 1;
    },
    // 비용 분석 결과
    selectedCostKeys() {
      const map = this.fieldDisplayToKeyMap;
      const picked = this.columns.filter((col) => {
        var _a, _b;
        return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
      }).map((col) => map[this.fieldSchema[col].selectedField]).filter(Boolean);
      return Array.from(new Set(picked));
    },
    hasFuelSelected() {
      return this.selectedCostKeys.includes("fuel_cost");
    },
    hasLaborSelected() {
      return this.selectedCostKeys.includes("labor_cost");
    },
    hasOtherSelected() {
      return this.selectedCostKeys.includes("other_cost");
    },
    // 선택된 항목 개수
    selectedFieldsCount() {
      return this.columns.filter(
        (col) => {
          var _a, _b;
          return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
        }
      ).length;
    },
    // 비용 분석 결과 요약
    compareFilteredRecords() {
      if (!this.compareFilters.ship_type) return [];
      const sy = this.filters.start_year, sm = this.filters.start_month;
      const ey = this.filters.end_year, em = this.filters.end_month;
      const start = sy + sm, end = ey + em;
      return this.uploadPreviewRecords.filter((row) => {
        var _a, _b, _c, _d;
        const y = String(row.month_str ? row.month_str.split("-")[0] : (_a = row.trial_date) == null ? void 0 : _a.slice(0, 4));
        const m = String(row.month_str ? row.month_str.split("-")[1] : (_d = (_c = (_b = row.trial_date) == null ? void 0 : _b.match(/(\d{1,2})월/)) == null ? void 0 : _c[1]) == null ? void 0 : _d.padStart(2, "0"));
        const ym = y + m;
        const shipOk = row.ship_type === this.compareFilters.ship_type;
        const hullOk = this.compareFilters.hull_number ? row.hull_number === this.compareFilters.hull_number : true;
        return ym >= start && ym <= end && shipOk && hullOk;
      });
    },
    // 비교 필터링된 호선
    hasAnySelected() {
      return this.selectedCostKeys && this.selectedCostKeys.length > 0;
    },
    // 비교 필터링된 레코드가 있는지 확인
    hasCompareSelected() {
      return !!this.compareFilters.ship_type && this.compareFilteredRecords.length > 0;
    },
    // 조타수 비용 선택 여부
    hasHelmSelected() {
      return this.selectedCostKeys.includes("helm_tot_cost");
    },
    hasAllFourSelected() {
      const need = ["fuel_cost", "labor_cost", "other_cost", "helm_tot_cost"];
      return need.every((k) => this.selectedCostKeys.includes(k));
    },
    // 선택된 컬럼을 기준으로 CSV 다운로드
    displayedColumns() {
      return [...this.baseColumns, ...this.selectedColumns];
    }
  },
  methods: {
    // CSV 파일 다운로드
    onPageChange(page) {
      this.rawPage = page - 1;
    },
    // CSV 파일 업로드
    onUploadFileChange(e) {
      this.uploadedFile = e.target.files[0];
    },
    // CSV 업로드 후 미리보기
    async uploadAndPreviewCsv() {
      if (!this.uploadedFile) return;
      const formData = new FormData();
      formData.append("file", this.uploadedFile);
      try {
        const res = await axios.post("/synth-data/upload", formData);
        this.uploadPreviewColumns = res.data.columns;
        this.uploadPreviewRecords = res.data.records;
        this.afterCsvUpload(res.data.columns);
        this.uploadCurrentPage = 1;
        this.monthlyTablePage = 0;
        this.csvLoaded = true;
        this.filterApplied = false;
      } catch (err) {
        this.csvLoaded = false;
        console.error("CSV 업로드 실패", err);
      }
    },
    // CSV 업로드 후 처리
    afterCsvUpload(columns) {
      this.columns = columns;
      this.fieldSchema = {};
      const metaCandidates = [
        "trial_id",
        "trial_date",
        "delay_yn",
        "time_taken",
        "delay_time",
        "yard_name",
        "ship_type",
        "hull_number",
        "month_str",
        "Timestamp"
      ];
      columns.forEach((col) => {
        const isMeta = metaCandidates.includes(col);
        this.fieldSchema[col] = {
          include: true,
          selectedField: isMeta ? "" : "",
          meta: isMeta
        };
      });
      this.monthlyTablePage = 0;
      const records = this.uploadPreviewRecords;
      for (const r of records) {
        if (!r.month_str || !String(r.month_str).match(/^\d{4}-\d{2}$/)) {
          if (r.trial_date) {
            const m_ = String(r.trial_date).match(/(\d{4})년\s*(\d{1,2})월/);
            if (m_) r.month_str = `${m_[1]}-${m_[2].padStart(2, "0")}`;
          }
        }
      }
      const months = [];
      const years = [];
      for (const r of records) {
        if (!r.month_str && r.trial_date) {
          const m_ = r.trial_date.match(/(\d{4})년\s*(\d{1,2})월/);
          if (m_) {
            r.month_str = `${m_[1]}-${m_[2].padStart(2, "0")}`;
          }
        }
        let y, m;
        if (r.month_str) {
          [y, m] = r.month_str.split("-");
        }
        if (!y && r.trial_date) {
          const m_ = r.trial_date.match(/(\d{4})년\s*(\d{1,2})월/);
          if (m_) {
            y = m_[1];
            m = m_[2].padStart(2, "0");
          }
        }
        if (y && !years.includes(y)) years.push(y);
        if (m && !months.includes(m)) months.push(m);
      }
      this.years = years.sort((a, b) => Number(a) - Number(b));
      this.months = months.sort((a, b) => Number(a) - Number(b));
      this.filters.start_year = this.years[0] || "";
      this.filters.start_month = this.months[0] || "";
      this.filters.end_year = this.years[this.years.length - 1] || "";
      this.filters.end_month = this.months[this.months.length - 1] || "";
      this.shipTypes = Array.from(new Set(records.map((r) => r.ship_type).filter(Boolean)));
      this.hullNumbers = Array.from(new Set(records.map((r) => r.hull_number).filter(Boolean)));
      this.hullMapping = {};
      for (const r of records) {
        if (!r.ship_type || !r.hull_number) continue;
        if (!this.hullMapping[r.ship_type]) this.hullMapping[r.ship_type] = /* @__PURE__ */ new Set();
        this.hullMapping[r.ship_type].add(r.hull_number);
      }
      for (const k in this.hullMapping) {
        this.hullMapping[k] = Array.from(this.hullMapping[k]);
      }
      this.filters.ship_type = "";
      this.filters.hull_number = "";
      if (records.length > 0) {
        if (!this.filters.ship_type && records[0].ship_type)
          this.filters.ship_type = records[0].ship_type;
        if (!this.filters.hull_number && records[0].hull_number)
          this.filters.hull_number = records[0].hull_number;
        if (!this.filters.start_year && records[0].month_str)
          this.filters.start_year = records[0].month_str.split("-")[0];
        if (!this.filters.start_month && records[0].month_str)
          this.filters.start_month = records[0].month_str.split("-")[1].padStart(2, "0");
        if (!this.filters.end_year && records[records.length - 1].month_str)
          this.filters.end_month = records[records.length - 1].month_str.split("-")[1].padStart(2, "0");
        if (!this.filters.end_month && records[records.length - 1].month_str)
          this.filters.end_month = records[records.length - 1].month_str.split("-")[1];
      }
    },
    // 분석 항목 스키마 저장 (UI 저장)
    saveFieldSchema() {
      const selectedRows = this.columns.filter((col) => {
        var _a, _b;
        return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
      }).map((col) => ({ col, fieldDisplay: this.fieldSchema[col].selectedField }));
      if (selectedRows.length === 0) {
        this.fieldSchemaError = "하나도 선택되지 않았습니다";
        this.fieldSchemaSaved = false;
        return;
      }
      this.fieldSchemaError = "";
      this.selectedColumns = [...new Set(selectedRows.map((r) => r.col))];
      this.selectedFieldsForAnalysis = selectedRows;
      this.saveMessage = "설정이 저장되었습니다.";
      this.fieldSchemaSaved = true;
      this.$nextTick(() => this.drawCostBarChart());
    },
    // 분석 항목 스키마 저장 모달 열기
    openDbSaveModal() {
      this.dbSaveMessage = "";
      this.dbTableName = "";
      this.dbUserName = "";
      this.showDbSaveModal = true;
    },
    // 분석 항목 스키마 저장 모달 닫기
    async saveCsvToDb() {
      var _a, _b;
      if (!this.uploadedFile) {
        this.dbSaveMessage = "업로드된 파일이 없습니다.";
        return;
      }
      if (!this.dbTableName || !this.dbUserName) {
        this.dbSaveMessage = "테이블명과 사용자명을 모두 입력하세요.";
        return;
      }
      const formData = new FormData();
      formData.append("file", this.uploadedFile);
      formData.append("table_name", this.dbTableName);
      formData.append("username", this.dbUserName);
      formData.append("schema_name", "begas");
      try {
        let res = await axios.post("/synth-data/save-to-db", formData);
        if (res.data.exists) {
          if (confirm(res.data.message + "\n덮어쓰시겠습니까?")) {
            formData.append("force", "true");
            res = await axios.post("/synth-data/save-to-db", formData);
            alert(res.data.message);
          }
        } else {
          alert(res.data.message);
        }
        this.showDbSaveModal = false;
      } catch (err) {
        this.dbSaveMessage = "저장 실패: " + (((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || err.message);
      }
    },
    // 분석 항목 스키마를 DB에 저장
    async saveFieldSchemaToDb() {
      var _a, _b;
      if (!this.fieldSchemaTableName || !this.fieldSchemaUserName) {
        this.fieldSchemaSaveMessage = "테이블명과 사용자명을 모두 입력하세요.";
        return;
      }
      const selected = this.columns.filter((col) => this.fieldSchema[col].include).map((col) => ({
        col_name: col,
        field: this.fieldSchema[col].selectedField
      }));
      try {
        await axios.post("/analysis-api/save-field-schema", {
          schema: selected,
          table_name: this.fieldSchemaTableName,
          created_by: this.fieldSchemaUserName
        });
        this.saveMessage = "분석 항목 설정이 DB에 저장되었습니다.";
        this.showFieldSchemaSaveModal = false;
        this.fieldSchemaSaveMessage = "";
      } catch (e) {
        this.fieldSchemaSaveMessage = "서버 저장 실패: " + (((_b = (_a = e.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || e.message);
      }
    },
    // CSV 텍스트를 Blob으로 변환 (UTF-8 BOM 포함)
    makeCsvBlob(csvText) {
      const BOM = new Uint8Array([239, 187, 191]);
      return new Blob([BOM, csvText], { type: "text/csv;charset=utf-8;" });
    },
    // 선택된 항목 CSV 다운로드
    downloadSelectedMappingCSV() {
      const rows = this.columns.filter((col) => {
        var _a, _b;
        return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
      }).map((col) => [col, this.fieldSchema[col].selectedField]);
      if (!rows.length) {
        alert("선택된 항목이 없습니다. '분석 항목 설정'에서 항목을 선택·저장하세요.");
        return;
      }
      const header = ["변수명", "항목(선택)"];
      const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [header.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
      const blob = this.makeCsvBlob(csv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "selected_fields.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    translate(n) {
      let r = n;
      for (const [k, v] of Object.entries(this.translationDict)) {
        r = r.replace(new RegExp(k, "g"), v);
      }
      return r;
    },
    // 월별 시운전 횟수 차트에서 날짜 포맷팅
    formatMonth(s) {
      if (!s) return "";
      const parts = s.split("-");
      if (parts.length !== 2) return s;
      const [y, m] = parts;
      return `${y}년 ${parseInt(m)}월`;
    },
    async downloadCSV() {
      const data = this.filteredRecords;
      if (!data.length) {
        alert("다운로드할 데이터가 없습니다.");
        return;
      }
      const columns = this.displayedColumns;
      const rows = [
        columns.join(","),
        ...data.map(
          (row) => columns.map(
            (col) => row[col] !== void 0 ? `"${String(row[col]).replace(/"/g, '""')}"` : ""
          ).join(",")
        )
      ];
      const csv = rows.join("\r\n");
      const blob = this.makeCsvBlob(csv);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "filtered_result.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    // 월별 시운전 횟수 차트 그리기
    drawMonthlyOpsChart() {
      const canvas = this.$refs.monthlyOpsChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (canvas._chart) {
        canvas._chart.destroy();
        canvas._chart = null;
      }
      const data = this.monthlyTableData;
      if (!data.length) return;
      const labels = data.map((d) => this.formatMonth(d.month));
      const normal = data.map((d) => d.normal);
      const delay = data.map((d) => d.delay);
      canvas._chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Normal", data: normal, backgroundColor: "#1ca392" },
            { label: "Delay", data: delay, backgroundColor: "#ffc81b" }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "월별 시운전 테스트 횟수" }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "횟수" } },
            x: { title: { display: true, text: "날짜" } }
          }
        }
      });
    },
    // 비용 요약 (상태별)
    getCostSummaryByStatus() {
      const selectedFields = this.columns.filter(
        (col) => {
          var _a, _b;
          return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
        }
      ).map((col) => col);
      const items = selectedFields.length ? selectedFields : ["fuel_cost", "helm_tot_cost", "labor_cost", "other_cost"];
      const statuses = ["전체", "정상", "지연"];
      const records = this.filteredRecords;
      const result = [];
      for (const status of statuses) {
        let rows = records;
        if (status !== "전체") rows = rows.filter(
          (r) => status === "정상" ? r.delay_yn === "정상" || r.delay_yn === "N" || r.delay_yn === 0 || r.delay_yn === "0" : r.delay_yn === "지연" || r.delay_yn === "Y" || r.delay_yn === 1 || r.delay_yn === "1"
        );
        const means = {};
        for (const key of items) {
          means[key] = rows.length > 0 ? rows.reduce((a, b) => a + Number(b[key] || 0), 0) / rows.length / 1e6 : 0;
        }
        means["total_cost"] = items.reduce((sum, k) => sum + means[k], 0);
        result.push({
          status,
          ...Object.fromEntries(items.map((k) => [k, means[k].toFixed(2)])),
          total_cost: means["total_cost"].toFixed(2)
        });
      }
      return result;
    },
    // 비용 바 차트 그리기
    drawCostBarChart() {
      const canvas = this.$refs.costBarChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (this.costChart) this.costChart.destroy();
      const map = this.fieldDisplayToKeyMap;
      const selectedKeys = [...new Set(this.columns.filter((col) => {
        var _a, _b;
        return ((_a = this.fieldSchema[col]) == null ? void 0 : _a.include) && ((_b = this.fieldSchema[col]) == null ? void 0 : _b.selectedField);
      }).map((col) => map[this.fieldSchema[col].selectedField]).filter(Boolean))];
      const allItems = ["fuel_cost", "helm_tot_cost", "labor_cost", "other_cost"];
      const labelMap = { fuel_cost: "Fuel", helm_tot_cost: "Helm", labor_cost: "Labor", other_cost: "Other" };
      const labels = [...allItems, "total_cost"].map((k) => labelMap[k] || k);
      const summary = this.getCostSummaryByStatusPartial(selectedKeys);
      const datasets = ["전체", "정상", "지연"].map((status, idx) => ({
        label: status,
        data: [...allItems, "total_cost"].map((k) => Number(summary[idx][k])),
        backgroundColor: ["#f15628", "#1ca392", "#ffc81b"][idx]
      }));
      this.costChart = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
          plugins: { legend: { position: "top" }, title: { display: true, text: "운영 상태별 평균 비용 (단위: 백만 원)" } },
          scales: { y: { beginAtZero: true } }
        }
      });
    },
    // 선택한 항목에 대한 비용 요약 (상태별)
    getCostSummaryByStatusPartial(selectedKeys) {
      const allItems = ["fuel_cost", "helm_tot_cost", "labor_cost", "other_cost"];
      const statuses = ["전체", "정상", "지연"];
      const records = this.filteredRecords;
      const result = [];
      for (const status of statuses) {
        let rows = records;
        if (status !== "전체") rows = rows.filter(
          (r) => status === "정상" ? r.delay_yn === "정상" || r.delay_yn === "N" || r.delay_yn === 0 || r.delay_yn === "0" : r.delay_yn === "지연" || r.delay_yn === "Y" || r.delay_yn === 1 || r.delay_yn === "1"
        );
        const means = {};
        let totalCost = 0;
        for (const key of allItems) {
          if (selectedKeys.includes(key)) {
            means[key] = rows.length > 0 ? rows.reduce((a, b) => a + Number(b[key] || 0), 0) / rows.length / 1e6 : 0;
            totalCost += means[key];
          } else {
            means[key] = 0;
          }
        }
        means["total_cost"] = totalCost;
        result.push({
          status,
          ...Object.fromEntries(allItems.map((k) => [k, means[k].toFixed(2)])),
          total_cost: means["total_cost"].toFixed(2)
        });
      }
      return result;
    },
    // 선택된 행의 총 비용 합계 계산
    rowSelectedSum(row) {
      const keys = Array.isArray(this.selectedCostKeys) ? this.selectedCostKeys : [];
      return keys.reduce((sum, k) => sum + (Number(row == null ? void 0 : row[k]) || 0), 0);
    },
    destroyChartRef(canvas) {
      if (canvas && canvas._chart) {
        canvas._chart.destroy();
        canvas._chart = null;
      }
    },
    // 차트 그리기 (총경비, 인건비, 유류비)
    drawAllCostLineCharts() {
      if (this.hasAnySelected) {
        this.drawSingleCostLineChart("total_cost", this.$refs.totalCostLineChart, "총경비(단위 : 백만 원)");
      } else {
        this.destroyChartRef(this.$refs.totalCostLineChart);
      }
      if (this.hasLaborSelected) {
        this.drawSingleCostLineChart("labor_cost", this.$refs.laborCostLineChart, "인건비(단위 : 백만 원)");
      } else {
        this.destroyChartRef(this.$refs.laborCostLineChart);
      }
      if (this.hasFuelSelected) {
        this.drawSingleCostLineChart("fuel_cost", this.$refs.fuelCostLineChart, "유류비(단위 : 백만 원)");
      } else {
        this.destroyChartRef(this.$refs.fuelCostLineChart);
      }
    },
    // 단일 비용 라인 차트 그리기
    drawSingleCostLineChart(field, canvas, title) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (canvas._chart) {
        canvas._chart.destroy();
        canvas._chart = null;
      }
      const main = this.getCostSeriesFor(this.filteredRecords, field);
      let unionMonths = [...main.months];
      let cmpAlignedTotal = null, cmpAlignedNormal = null, cmpAlignedDelay = null;
      let cmpLabel = "";
      if (this.hasCompareSelected) {
        const cmp = this.getCostSeriesFor(this.compareFilteredRecords, field);
        unionMonths = Array.from(/* @__PURE__ */ new Set([...main.months, ...cmp.months])).sort();
        const mainAlignedTotal = this.alignToUnion(unionMonths, main.months, main.total);
        const mainAlignedNormal = this.alignToUnion(unionMonths, main.months, main.normal);
        const mainAlignedDelay = this.alignToUnion(unionMonths, main.months, main.delay);
        cmpAlignedTotal = this.alignToUnion(unionMonths, cmp.months, cmp.total);
        cmpAlignedNormal = this.alignToUnion(unionMonths, cmp.months, cmp.normal);
        cmpAlignedDelay = this.alignToUnion(unionMonths, cmp.months, cmp.delay);
        main.total = mainAlignedTotal;
        main.normal = mainAlignedNormal;
        main.delay = mainAlignedDelay;
        main.months = unionMonths;
        const st = this.compareFilters.ship_type || "";
        const hn = this.compareFilters.hull_number || "";
        cmpLabel = st ? `${this.translate(st)}${hn ? " - " + hn : ""}` : "비교";
      }
      const labels = unionMonths.map((m) => {
        const [y, mo] = m.split("-");
        return `${y}년 ${parseInt(mo)}월`;
      });
      const datasets = [
        // 메인(굵고 선명)
        { label: "Total", data: main.total, borderColor: "#f15628", fill: false, tension: 0.1, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4, spanGaps: true },
        { label: "Normal", data: main.normal, borderColor: "#1ca392", fill: false, tension: 0.1, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4, spanGaps: true },
        { label: "Delay", data: main.delay, borderColor: "#ffc81b", fill: false, tension: 0.1, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4, spanGaps: true }
      ];
      if (cmpAlignedTotal) {
        datasets.push(
          { label: `Total (${cmpLabel})`, data: cmpAlignedTotal, borderColor: "#f15628", borderDash: [6, 3], borderWidth: 1, pointRadius: 0, fill: false, tension: 0.1, spanGaps: true },
          { label: `Normal (${cmpLabel})`, data: cmpAlignedNormal, borderColor: "#1ca392", borderDash: [6, 3], borderWidth: 1, pointRadius: 0, fill: false, tension: 0.1, spanGaps: true, hidden: true },
          { label: `Delay (${cmpLabel})`, data: cmpAlignedDelay, borderColor: "#ffc81b", borderDash: [6, 3], borderWidth: 1, pointRadius: 0, fill: false, tension: 0.1, spanGaps: true, hidden: true }
        );
      }
      canvas._chart = new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: {
          responsive: true,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: this.hasCompareSelected ? `${title} (비교 포함)` : title },
            tooltip: {
              callbacks: {
                label: (ctx2) => {
                  const v = ctx2.parsed.y;
                  if (v == null) return `${ctx2.dataset.label}: -`;
                  return `${ctx2.dataset.label}: ${v.toLocaleString("ko-KR")} 백만 원`;
                }
              }
            }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "백만 원" } },
            x: { title: { display: true, text: "날짜" } }
          }
        }
      });
    },
    // 금액 포맷팅 (원 단위)
    formatWon(val) {
      if (val === void 0 || val === null || isNaN(val)) return "0 원";
      return Number(val).toLocaleString("ko-KR", { maximumFractionDigits: 0 }) + " 원";
    },
    // 날짜를 'YYYY-MM' 형식으로 변환
    parseYM(ym) {
      const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
      return { y, m };
    },
    // 날짜를 'YYYY-MM' 형식으로 변환 (Date 객체)
    monthsUntilInclusive(startYm, endYm) {
      const { y: sy, m: sm } = this.parseYM(startYm);
      const { y: ey, m: em } = this.parseYM(endYm);
      const total = (ey - sy) * 12 + (em - sm);
      const out = [];
      for (let i = 1; i <= total; i++) {
        const y = sy + Math.floor((sm - 1 + i) / 12);
        const m = (sm - 1 + i) % 12 + 1;
        out.push(`${y}-${String(m).padStart(2, "0")}`);
      }
      return out;
    },
    // 인건비 예측 실행
    runPersonnelPrediction() {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (!this.hasLaborSelected) {
        this.predictedPersonnelTable = [];
        (_b = (_a = this.personnelChart) == null ? void 0 : _a.destroy) == null ? void 0 : _b.call(_a);
        return;
      }
      const records = this.filteredRecords;
      if (!records.length) {
        this.predictedPersonnelTable = [];
        (_d = (_c = this.personnelChart) == null ? void 0 : _c.destroy) == null ? void 0 : _d.call(_c);
        return;
      }
      const rows = records.map((r) => ({
        ym: r.month_str || this.parseDateToMonthStr(r.trial_date),
        val: Number(r.labor_cost)
      })).filter((r) => r.ym && !isNaN(r.val));
      const byYM = {};
      rows.forEach((r) => {
        (byYM[r.ym] ||= []).push(r.val);
      });
      const months = Object.keys(byYM).sort();
      if (months.length < 2) return;
      const X = months.map((m) => (/* @__PURE__ */ new Date(m + "-01")).getTime());
      const y = months.map((m) => byYM[m].reduce((a, b) => a + b, 0) / byYM[m].length);
      const reg = this.fitLinearOrFlat(X, y);
      const futMonths = this.monthsUntilInclusive(months.at(-1), "2025-12");
      const futT = futMonths.map((m) => (/* @__PURE__ */ new Date(m + "-01")).getTime());
      const yhat = futT.map((t) => reg.predict(t));
      const ctx = (_f = (_e = this.$refs.personnelPredictionChart) == null ? void 0 : _e.getContext) == null ? void 0 : _f.call(_e, "2d");
      (_h = (_g = this.personnelChart) == null ? void 0 : _g.destroy) == null ? void 0 : _h.call(_g);
      if (ctx) {
        this.personnelChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [...months, ...futMonths],
            datasets: [
              { label: "Actual", data: y, borderColor: "blue", fill: false, tension: 0.1, pointRadius: 3 },
              {
                label: "Predicted",
                data: [...Array(months.length).fill(null), ...yhat],
                borderColor: "red",
                borderDash: [4, 2],
                fill: false,
                tension: 0.1,
                pointRadius: 3
              }
            ]
          },
          options: {
            plugins: { legend: { position: "top" }, title: { display: true, text: "인건비 예측" } },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "인건비(원)" } },
              x: { title: { display: true, text: "월" } }
            }
          }
        });
      }
      this.predictedPersonnelTable = futMonths.map((ym, i) => ({ date: ym, value: this.formatWon(yhat[i]) })).filter((r) => r.date.startsWith("2025-"));
    },
    // 월별 비용 시리즈 생성
    getCostSeriesFor(records, field) {
      if (!records.length) return { months: [], total: [], normal: [], delay: [] };
      const months = Array.from(new Set(records.map((r) => r.month_str))).sort();
      const total = [], normal = [], delay = [];
      for (const m of months) {
        const monthRows = records.filter((r) => r.month_str === m);
        const picker = (r) => field === "total_cost" ? this.rowSelectedSum(r) : Number(r[field]) || 0;
        const mean = (rows) => rows.length ? rows.reduce((a, b) => a + picker(b), 0) / rows.length / 1e6 : 0;
        total.push(Number(mean(monthRows).toFixed(2)));
        normal.push(Number(mean(monthRows.filter((r) => r.delay_yn === "정상" || r.delay_yn === "N" || r.delay_yn === 0 || r.delay_yn === "0")).toFixed(2)));
        delay.push(Number(mean(monthRows.filter((r) => r.delay_yn === "지연" || r.delay_yn === "Y" || r.delay_yn === 1 || r.delay_yn === "1")).toFixed(2)));
      }
      return { months, total, normal, delay };
    },
    // 월별 비용 정렬 
    alignToUnion(unionMonths, months, arr) {
      const map = /* @__PURE__ */ Object.create(null);
      months.forEach((m, i) => {
        map[m] = arr[i];
      });
      return unionMonths.map((m) => m in map ? map[m] : null);
    },
    // 기타 비용 예측 실행
    runOtherPrediction() {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (!this.hasOtherSelected) {
        this.predictedOtherTable = [];
        (_b = (_a = this.otherChart) == null ? void 0 : _a.destroy) == null ? void 0 : _b.call(_a);
        return;
      }
      const records = this.filteredRecords;
      if (!records.length) {
        this.predictedOtherTable = [];
        (_d = (_c = this.otherChart) == null ? void 0 : _c.destroy) == null ? void 0 : _d.call(_c);
        return;
      }
      const rows = records.map((r) => ({
        ym: r.month_str || this.parseDateToMonthStr(r.trial_date),
        val: Number(r.other_cost)
      })).filter((r) => r.ym && !isNaN(r.val));
      const byYM = {};
      rows.forEach((r) => {
        (byYM[r.ym] ||= []).push(r.val);
      });
      const months = Object.keys(byYM).sort();
      if (months.length < 2) return;
      const X = months.map((m) => (/* @__PURE__ */ new Date(m + "-01")).getTime());
      const y = months.map((m) => byYM[m].reduce((a, b) => a + b, 0) / byYM[m].length);
      const reg = this.fitLinearOrFlat(X, y);
      const futMonths = this.monthsUntilInclusive(months.at(-1), "2025-12");
      const futT = futMonths.map((m) => (/* @__PURE__ */ new Date(m + "-01")).getTime());
      const yhat = futT.map((t) => reg.predict(t));
      const ctx = (_f = (_e = this.$refs.otherPredictionChart) == null ? void 0 : _e.getContext) == null ? void 0 : _f.call(_e, "2d");
      (_h = (_g = this.otherChart) == null ? void 0 : _g.destroy) == null ? void 0 : _h.call(_g);
      if (ctx) {
        this.otherChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [...months, ...futMonths],
            datasets: [
              { label: "Actual", data: y, borderColor: "blue", fill: false, tension: 0.1, pointRadius: 3 },
              {
                label: "Predicted",
                data: [...Array(months.length).fill(null), ...yhat],
                borderColor: "red",
                borderDash: [4, 2],
                fill: false,
                tension: 0.1,
                pointRadius: 3
              }
            ]
          },
          options: {
            plugins: { legend: { position: "top" }, title: { display: true, text: "기타 비용 예측" } },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "기타비용(원)" } },
              x: { title: { display: true, text: "월" } }
            }
          }
        });
      }
      this.predictedOtherTable = futMonths.map((ym, i) => ({ date: ym, value: this.formatWon(yhat[i]) })).filter((r) => r.date.startsWith("2025-"));
    },
    // 날짜 문자열을 'YYYY-MM' 형식으로 변환
    parseDateToMonthStr(str) {
      const m = String(str).match(/(\d{4})년\s*(\d{1,2})월/);
      if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
      return "";
    },
    // 유류비 예측
    fitLinearOrFlat(X, y) {
      if (!X || !y || X.length < 2 || y.length < 2) {
        const c = y && y.length ? y[y.length - 1] : 0;
        return { predict: () => c };
      }
      return simpleLinearRegression(X, y);
    },
    ymToDate(ym) {
      return /* @__PURE__ */ new Date(`${ym}-01`);
    },
    // 유류비 예측 실행
    runFuelPrediction() {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      if (!this.hasFuelSelected) {
        this.predictedFuelTable = [];
        (_b = (_a = this.fuelChart) == null ? void 0 : _a.destroy) == null ? void 0 : _b.call(_a);
        return;
      }
      const recs = this.filteredRecords;
      if (!recs.length) {
        this.predictedFuelTable = [];
        (_d = (_c = this.fuelChart) == null ? void 0 : _c.destroy) == null ? void 0 : _d.call(_c);
        return;
      }
      const rows = recs.map((r) => ({
        ym: r.month_str || this.parseDateToMonthStr(r.trial_date),
        val: Number(r.fuel_cost)
      })).filter((r) => r.ym && !isNaN(r.val));
      const byYM = {};
      rows.forEach((r) => {
        (byYM[r.ym] ||= []).push(r.val);
      });
      const months = Object.keys(byYM).sort();
      if (!months.length) return;
      const X = months.map((m) => this.ymToDate(m).getTime());
      const y = months.map((m) => byYM[m].reduce((a, b) => a + b, 0) / byYM[m].length);
      const reg = this.fitLinearOrFlat(X, y);
      const futMonths = this.monthsUntilInclusive(months.at(-1), "2025-12");
      const futT = futMonths.map((m) => this.ymToDate(m).getTime());
      const yhat = futT.map((t) => reg.predict(t));
      const ctx = (_f = (_e = this.$refs.fuelPredictionChart) == null ? void 0 : _e.getContext) == null ? void 0 : _f.call(_e, "2d");
      (_h = (_g = this.fuelChart) == null ? void 0 : _g.destroy) == null ? void 0 : _h.call(_g);
      if (ctx) {
        this.fuelChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [...months, ...futMonths],
            datasets: [
              { label: "Actual", data: y, borderColor: "blue", fill: false, tension: 0.1, pointRadius: 3 },
              {
                label: "Predicted",
                data: [...Array(months.length).fill(null), ...yhat],
                borderColor: "red",
                borderDash: [4, 2],
                fill: false,
                tension: 0.1,
                pointRadius: 3
              }
            ]
          },
          options: {
            plugins: { legend: { position: "top" }, title: { display: true, text: "유류비 예측" } },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "유류비(원)" } },
              x: { title: { display: true, text: "월" } }
            }
          }
        });
      }
      this.predictedFuelTable = futMonths.map((ym, i) => ({ date: ym, value: this.formatWon(yhat[i]) })).filter((r) => r.date.startsWith("2025-"));
    },
    // 총 경비 예측
    runTotalPrediction() {
      var _a, _b, _c, _d, _e, _f;
      const recs = this.filteredRecords;
      if (!recs.length) {
        this.predictedTotalTable = [];
        (_b = (_a = this.totalCostPredChart) == null ? void 0 : _a.destroy) == null ? void 0 : _b.call(_a);
        return;
      }
      const rows = recs.map((r) => ({
        ym: r.month_str || this.parseDateToMonthStr(r.trial_date),
        val: this.rowSelectedSum(r)
      })).filter((r) => r.ym && !isNaN(r.val));
      const byYM = {};
      rows.forEach((r) => {
        (byYM[r.ym] ||= []).push(r.val);
      });
      const months = Object.keys(byYM).sort();
      if (!months.length) return;
      const X = months.map((m) => this.ymToDate(m).getTime());
      const y = months.map((m) => byYM[m].reduce((a, b) => a + b, 0) / byYM[m].length);
      const reg = this.fitLinearOrFlat(X, y);
      const futMonths = this.monthsUntilInclusive(months.at(-1), "2025-12");
      const futT = futMonths.map((m) => this.ymToDate(m).getTime());
      const yhat = futT.map((t) => reg.predict(t));
      const ctx = (_d = (_c = this.$refs.totalCostChart) == null ? void 0 : _c.getContext) == null ? void 0 : _d.call(_c, "2d");
      (_f = (_e = this.totalCostPredChart) == null ? void 0 : _e.destroy) == null ? void 0 : _f.call(_e);
      if (ctx) {
        this.totalCostPredChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: [...months, ...futMonths],
            datasets: [
              { label: "Actual (선택합)", data: y, borderColor: "blue", fill: false, tension: 0.1, pointRadius: 3 },
              {
                label: "Predicted",
                data: [...Array(months.length).fill(null), ...yhat],
                borderColor: "red",
                borderDash: [4, 2],
                fill: false,
                tension: 0.1,
                pointRadius: 3
              }
            ]
          },
          options: {
            plugins: { legend: { position: "top" }, title: { display: true, text: "총 경비 예측(선택 항목 합)" } },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: "총 경비(원)" } },
              x: { title: { display: true, text: "월" } }
            }
          }
        });
      }
      this.predictedTotalTable = futMonths.map((ym, i) => ({ date: ym, value: this.formatWon(yhat[i]) })).filter((r) => r.date.startsWith("2025-"));
    },
    // 비용 레이더 차트 그리기
    drawCostRadarChart() {
      var _a, _b, _c, _d;
      if (!this.filterApplied || !this.hasAllFourSelected) {
        const canvas2 = this.$refs.costRadarChart;
        if (canvas2 && canvas2._chart) {
          canvas2._chart.destroy();
          canvas2._chart = null;
        }
        (_b = (_a = this.costRadarChart) == null ? void 0 : _a.destroy) == null ? void 0 : _b.call(_a);
        this.costRadarChart = null;
        return;
      }
      const canvas = this.$refs.costRadarChart;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (canvas._chart) {
        canvas._chart.destroy();
        canvas._chart = null;
      }
      (_d = (_c = this.costRadarChart) == null ? void 0 : _c.destroy) == null ? void 0 : _d.call(_c);
      const rows = this.filteredRecords || [];
      const toN = (v) => this.toNumber(v);
      const isNormal = (r) => r.delay_yn === "정상" || r.delay_yn === "N" || r.delay_yn === 0 || r.delay_yn === "0";
      const isDelay = (r) => r.delay_yn === "지연" || r.delay_yn === "Y" || r.delay_yn === 1 || r.delay_yn === "1";
      const allRows = rows;
      const normalRows = rows.filter(isNormal);
      const delayRows = rows.filter(isDelay);
      const KEYS = ["fuel_cost", "labor_cost", "other_cost", "helm_tot_cost"];
      const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const avgTotal = {};
      const avgNormal = {};
      const avgDelay = {};
      KEYS.forEach((k) => {
        avgTotal[k] = mean(allRows.map((r) => toN(r[k])));
        avgNormal[k] = mean(normalRows.map((r) => toN(r[k])));
        avgDelay[k] = mean(delayRows.map((r) => toN(r[k])));
      });
      const sumSel = (arr) => mean(arr.map(
        (r) => toN(r.fuel_cost) + toN(r.labor_cost) + toN(r.other_cost) + toN(r.helm_tot_cost)
      ));
      avgTotal.total_cost = sumSel(allRows);
      avgNormal.total_cost = sumSel(normalRows);
      avgDelay.total_cost = sumSel(delayRows);
      const categories = ["Fuel Cost", "Labor Cost", "Total Cost", "Other Cost", "Helm Tot Cost"];
      const keyByLabel = {
        "Fuel Cost": "fuel_cost",
        "Labor Cost": "labor_cost",
        "Total Cost": "total_cost",
        "Other Cost": "other_cost",
        "Helm Tot Cost": "helm_tot_cost"
      };
      const ratioRow = (numer, denom, base) => {
        const d = denom || 0;
        if (!isFinite(d) || d === 0) return 100;
        return numer / d * base;
      };
      const totalVals = categories.map(() => 100);
      const normalVals = categories.map(
        (lbl) => ratioRow(avgNormal[keyByLabel[lbl]], avgTotal[keyByLabel[lbl]], 90)
      );
      const delayVals = categories.map(
        (lbl) => ratioRow(avgDelay[keyByLabel[lbl]], avgTotal[keyByLabel[lbl]], 110)
      );
      canvas._chart = new Chart(ctx, {
        type: "radar",
        data: {
          labels: categories,
          datasets: [
            { label: "Total", data: totalVals, borderColor: "#f15628", pointRadius: 2, backgroundColor: "rgba(241,86,40,0.10)" },
            { label: "Normal", data: normalVals, borderColor: "#1ca392", pointRadius: 2, backgroundColor: "rgba(28,163,146,0.10)" },
            { label: "Delay", data: delayVals, borderColor: "#ffc81b", pointRadius: 2, backgroundColor: "rgba(255,200,27,0.10)" }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Radar Chart by Cost" },
            tooltip: {
              callbacks: {
                label: (ctx2) => `${ctx2.dataset.label}: ${ctx2.formattedValue}%`
              }
            }
          },
          scales: {
            r: {
              min: 60,
              max: 125,
              ticks: { callback: (v) => `${v}%`, stepSize: 10 },
              pointLabels: { font: { size: 11 } }
            }
          }
        }
      });
      this.costRadarChart = canvas._chart;
    },
    async applyFilters() {
      if (!this.fieldSchemaSaved) {
        alert("분석 항목을 선택하고 저장하세요.");
        return;
      }
      this.rawPage = 0;
      this.monthlyTablePage = 0;
      this.filterApplied = true;
      this.loading = true;
      await this.$nextTick();
      this.drawCostBarChart();
      this.drawCostRadarChart();
      this.drawAllCostLineCharts();
      this.drawMonthlyOpsChart();
      this.runPersonnelPrediction();
      this.runOtherPrediction();
      this.runFuelPrediction();
      this.runTotalPrediction();
      this.loading = false;
      if (!this.fieldSchemaSaved) {
        alert("분석 항목을 선택하고 저장하세요.");
        return;
      }
    },
    // 숫자 변환 헬퍼
    toNumber(v) {
      if (v === null || v === void 0) return 0;
      const n = Number(String(v).replace(/[, ]/g, ""));
      return isNaN(n) ? 0 : n;
    },
    // 만원 단위로 포맷팅 (정수로 표기)
    formatMan(v) {
      return (v / 1e4).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
    },
    // 원인 분석
    async loadCause() {
      if (!this.selectedMonth) {
        alert("월을 선택하세요.");
        return;
      }
      const rows = (this.filteredRecords || []).map((r) => {
        const ym = r.month_str || this.parseDateToMonthStr(r.trial_date);
        return { ...r, ym };
      }).filter((r) => r.ym);
      if (!rows.length) {
        this.causeTable = [];
        this.causeSummary = {
          items: [],
          maxItem: { label: "", dir: "up", rateAbs: "0.00" },
          total: { from: "0", to: "0", dir: "up", rateAbs: "0.00" }
        };
        this.combinedItemMent = "";
        this.totalMentLine = "";
        this.maxChangeText = "";
        this.maxDetail = { label: "", from: "", to: "", rateAbs: "0.00", dir: "up" };
        return;
      }
      const selected = this.selectedCostKeys && this.selectedCostKeys.length ? this.selectedCostKeys : ["fuel_cost", "labor_cost", "other_cost"];
      const orderedKeys = ["fuel_cost", "labor_cost", "other_cost"].filter((k) => selected.includes(k));
      const labelMap = {
        fuel_cost: "유류비",
        labor_cost: "인건비",
        other_cost: "기타비용"
      };
      const picker = {
        fuel_cost: (r) => this.toNumber(r.fuel_cost),
        labor_cost: (r) => this.toNumber(r.labor_cost),
        other_cost: (r) => this.toNumber(r.other_cost)
      };
      const M = String(this.selectedMonth).padStart(2, "0");
      const rows2024 = rows.filter((r) => r.ym.startsWith("2024-"));
      const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const monthlyMean = (valuePicker) => {
        const byYM = {};
        rows.forEach((r) => {
          (byYM[r.ym] ||= []).push(valuePicker(r));
        });
        const months = Object.keys(byYM).sort();
        const X = months.map((m) => this.ymToDate(m).getTime());
        const y = months.map((m) => avg(byYM[m]));
        return { months, X, y };
      };
      const table = [];
      orderedKeys.forEach((k) => {
        const m = monthlyMean(picker[k]);
        const reg = this.fitLinearOrFlat(m.X, m.y);
        const targetT = this.ymToDate(`2025-${M}`).getTime();
        const pred2025 = reg.predict(targetT);
        const avg2024 = avg(rows2024.map(picker[k]));
        const rate = avg2024 && isFinite(avg2024) ? (pred2025 - avg2024) / avg2024 * 100 : 0;
        const dir = rate >= 0 ? "up" : "down";
        const rateAbsStr = Math.abs(rate).toFixed(2);
        table.push({
          item: labelMap[k],
          avg_2024: +avg2024.toFixed(2),
          pred_2025: +pred2025.toFixed(2),
          rate: +rate.toFixed(2),
          rateAbs: rateAbsStr,
          dir,
          ment: `${labelMap[k]} 항목은 "${this.formatMan(avg2024)}"만원에서 "${this.formatMan(pred2025)}"만원으로 "${rateAbsStr}"% ${dir === "up" ? "상승" : "하락"}`,
          _key: k
        });
      });
      this.causeTable = table;
      this.causeSummary.items = table.map((r) => ({
        label: r.item,
        from: this.formatMan(r.avg_2024),
        to: this.formatMan(r.pred_2025),
        rateAbs: Math.abs(r.rate).toFixed(2),
        dir: r.rate >= 0 ? "up" : "down"
      }));
      const maxRow = table.reduce((a, b) => Math.abs(b.rate) > Math.abs(a.rate) ? b : a, table[0]);
      this.causeSummary.maxItem = {
        label: maxRow.item,
        rateAbs: Math.abs(maxRow.rate).toFixed(2),
        dir: maxRow.rate >= 0 ? "up" : "down"
      };
      this.maxDetail = {
        label: maxRow.item,
        from: this.formatMan(maxRow.avg_2024),
        to: this.formatMan(maxRow.pred_2025),
        rateAbs: Math.abs(maxRow.rate).toFixed(2),
        dir: maxRow.rate >= 0 ? "up" : "down"
      };
      this.maxChangeText = `${maxRow.item}: ${maxRow.item} 항목은 "${this.formatMan(maxRow.avg_2024)}"만원에서 "${this.formatMan(maxRow.pred_2025)}"만원으로 "${Math.abs(maxRow.rate).toFixed(2)}"% ${maxRow.rate >= 0 ? "상승" : "하락"}`;
      const sumPicker = (r) => orderedKeys.reduce((s, k) => s + picker[k](r), 0);
      const mSum = monthlyMean(sumPicker);
      const regSum = this.fitLinearOrFlat(mSum.X, mSum.y);
      const predSum2025 = regSum.predict(this.ymToDate(`2025-${M}`).getTime());
      const avgSum2024 = avg(rows2024.map(sumPicker));
      const rateSum = avgSum2024 && isFinite(avgSum2024) ? (predSum2025 - avgSum2024) / avgSum2024 * 100 : 0;
      this.causeSummary.total = {
        from: this.formatMan(avgSum2024),
        to: this.formatMan(predSum2025),
        rateAbs: Math.abs(rateSum).toFixed(2),
        dir: rateSum >= 0 ? "up" : "down"
      };
      this.totalMentLine = `결과적으로 “총경비는 "${this.causeSummary.total.from}" 만원에서 "${this.causeSummary.total.to}" 만원으로 "${this.causeSummary.total.rateAbs}%" ${this.causeSummary.total.dir === "up" ? "상승" : "하락"}하였습니다.`;
    }
  },
  // 월별 운영비 차트 그리기
  async mounted() {
    const cy = (/* @__PURE__ */ new Date()).getFullYear();
    for (let y = 2015; y <= cy; y++) this.years.push(String(y));
    for (let m = 1; m <= 12; m++) this.months.push(String(m).padStart(2, "0"));
    this.filters.start_year = this.years[this.years.length - 2];
    this.filters.start_month = this.months[0];
    this.filters.end_year = this.years[this.years.length - 1];
    this.filters.end_month = this.months[0];
    this.filterApplied = false;
    this.selectedMonth = this.months[0];
  }
};
const { createElementVNode: _createElementVNode, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString, createCommentVNode: _createCommentVNode, vModelText: _vModelText, withDirectives: _withDirectives, createTextVNode: _createTextVNode, vModelCheckbox: _vModelCheckbox, vModelSelect: _vModelSelect, vShow: _vShow, normalizeClass: _normalizeClass } = await importShared("vue");
const _hoisted_1 = { class: "analysis-page" };
const _hoisted_2 = { class: "content-box" };
const _hoisted_3 = ["disabled"];
const _hoisted_4 = { key: 0 };
const _hoisted_5 = { class: "raw-table-wrapper" };
const _hoisted_6 = { class: "raw-table" };
const _hoisted_7 = { class: "pagination-controls" };
const _hoisted_8 = ["disabled"];
const _hoisted_9 = ["disabled"];
const _hoisted_10 = {
  key: 0,
  class: "content-box"
};
const _hoisted_11 = { style: { "display": "flex", "gap": "12px", "margin": "12px 0 0 0" } };
const _hoisted_12 = {
  key: 1,
  class: "modal-backdrop"
};
const _hoisted_13 = { class: "modal-content" };
const _hoisted_14 = { class: "modal-actions" };
const _hoisted_15 = {
  key: 0,
  style: { "margin-top": "8px", "color": "red" }
};
const _hoisted_16 = {
  key: 1,
  class: "content-box"
};
const _hoisted_17 = { class: "raw-table-wrapper" };
const _hoisted_18 = { class: "data-frame" };
const _hoisted_19 = ["onUpdate:modelValue"];
const _hoisted_20 = ["onUpdate:modelValue", "disabled"];
const _hoisted_21 = ["value"];
const _hoisted_22 = { class: "content-box" };
const _hoisted_23 = ["disabled"];
const _hoisted_24 = ["disabled"];
const _hoisted_25 = ["disabled"];
const _hoisted_26 = {
  key: 0,
  style: { "color": "red", "margin-top": "8px", "font-size": "15px" }
};
const _hoisted_27 = {
  key: 0,
  class: "modal-backdrop"
};
const _hoisted_28 = { class: "modal-content" };
const _hoisted_29 = { class: "modal-actions" };
const _hoisted_30 = {
  key: 0,
  class: "field-schema-error"
};
const _hoisted_31 = {
  key: 1,
  style: { "margin": "16px 0 0 0", "color": "green" }
};
const _hoisted_32 = { key: 2 };
const _hoisted_33 = ["value"];
const _hoisted_34 = ["value"];
const _hoisted_35 = ["disabled"];
const _hoisted_36 = {
  key: 0,
  style: { "color": "red" }
};
const _hoisted_37 = { class: "compare-box" };
const _hoisted_38 = ["value"];
const _hoisted_39 = ["value"];
const _hoisted_40 = {
  key: 3,
  class: "waiting"
};
const _hoisted_41 = { key: 4 };
const _hoisted_42 = { class: "loading" };
const _hoisted_43 = { key: 5 };
const _hoisted_44 = { class: "raw-table-wrapper" };
const _hoisted_45 = { class: "raw-table" };
const _hoisted_46 = { key: 0 };
const _hoisted_47 = {
  class: "pagination-controls",
  style: { "display": "flex", "justify-content": "center", "margin": "10px 0" }
};
const _hoisted_48 = ["disabled"];
const _hoisted_49 = { style: { "margin": "0 10px" } };
const _hoisted_50 = ["disabled"];
const _hoisted_51 = {
  key: 0,
  class: "chart-container"
};
const _hoisted_52 = { ref: "monthlyOpsChart" };
const _hoisted_53 = { class: "data-frame" };
const _hoisted_54 = {
  class: "pagination-controls",
  style: { "margin-top": "8px" }
};
const _hoisted_55 = ["disabled"];
const _hoisted_56 = ["disabled"];
const _hoisted_57 = { class: "data-frame" };
const _hoisted_58 = { class: "chart-container" };
const _hoisted_59 = { ref: "costBarChart" };
const _hoisted_60 = { class: "data-frame" };
const _hoisted_61 = { key: 1 };
const _hoisted_62 = {
  key: 2,
  class: "chart-container"
};
const _hoisted_63 = { ref: "totalCostLineChart" };
const _hoisted_64 = { key: 3 };
const _hoisted_65 = {
  key: 4,
  class: "chart-container"
};
const _hoisted_66 = { ref: "laborCostLineChart" };
const _hoisted_67 = { key: 5 };
const _hoisted_68 = {
  key: 6,
  class: "chart-container"
};
const _hoisted_69 = { ref: "fuelCostLineChart" };
const _hoisted_70 = { key: 7 };
const _hoisted_71 = {
  key: 8,
  class: "chart-container"
};
const _hoisted_72 = { ref: "personnelPredictionChart" };
const _hoisted_73 = { key: 9 };
const _hoisted_74 = { class: "data-frame" };
const _hoisted_75 = { key: 10 };
const _hoisted_76 = {
  key: 11,
  class: "chart-container"
};
const _hoisted_77 = { ref: "otherPredictionChart" };
const _hoisted_78 = { key: 12 };
const _hoisted_79 = { class: "data-frame" };
const _hoisted_80 = { key: 13 };
const _hoisted_81 = {
  key: 14,
  class: "chart-container"
};
const _hoisted_82 = { ref: "fuelPredictionChart" };
const _hoisted_83 = { key: 15 };
const _hoisted_84 = { class: "data-frame" };
const _hoisted_85 = { class: "chart-container" };
const _hoisted_86 = {
  id: "totalCostPredictionChart",
  ref: "totalCostChart"
};
const _hoisted_87 = { class: "data-frame" };
const _hoisted_88 = { class: "content-box" };
const _hoisted_89 = ["value"];
const _hoisted_90 = {
  key: 0,
  class: "data-frame"
};
const _hoisted_91 = {
  key: 1,
  class: "items"
};
const _hoisted_92 = { class: "ment" };
const _hoisted_93 = { class: "nums" };
const _hoisted_94 = {
  key: 2,
  class: "cause-summary"
};
const _hoisted_95 = { class: "max-item" };
const _hoisted_96 = { class: "ment" };
const _hoisted_97 = { class: "nums" };
const _hoisted_98 = { class: "total" };
const _hoisted_99 = { class: "ment" };
const _hoisted_100 = { class: "nums" };
const _hoisted_101 = {
  key: 16,
  class: "chart-container"
};
const _hoisted_102 = { ref: "costRadarChart" };
const _hoisted_103 = {
  key: 17,
  class: "content-box"
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock(), _createElementBlock("div", _hoisted_1, [
    _cache[84] || (_cache[84] = _createElementVNode("h2", null, "해상 시운전 비용 분석", -1)),
    _createElementVNode("div", _hoisted_2, [
      _cache[33] || (_cache[33] = _createElementVNode("h3", null, "CSV 업로드 (비용 분석용)", -1)),
      _createElementVNode("input", {
        type: "file",
        onChange: _cache[0] || (_cache[0] = (...args) => $options.onUploadFileChange && $options.onUploadFileChange(...args))
      }, null, 32),
      _createElementVNode("button", {
        onClick: _cache[1] || (_cache[1] = (...args) => $options.uploadAndPreviewCsv && $options.uploadAndPreviewCsv(...args)),
        disabled: !$data.uploadedFile
      }, "업로드 후 미리보기", 8, _hoisted_3)
    ]),
    $data.uploadPreviewColumns && $data.uploadPreviewColumns.length ? (_openBlock(), _createElementBlock("div", _hoisted_4, [
      _cache[38] || (_cache[38] = _createElementVNode("h3", null, "업로드한 CSV 데이터 미리보기", -1)),
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("table", _hoisted_6, [
          _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.uploadPreviewColumns, (c) => {
                return _openBlock(), _createElementBlock("th", { key: c }, _toDisplayString(c), 1);
              }), 128))
            ])
          ]),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.uploadPagedRecords, (row, idx) => {
              return _openBlock(), _createElementBlock("tr", { key: idx }, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.uploadPreviewColumns, (c) => {
                  return _openBlock(), _createElementBlock("td", { key: c }, _toDisplayString(row[c]), 1);
                }), 128))
              ]);
            }), 128))
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_7, [
        _createElementVNode("button", {
          onClick: _cache[2] || (_cache[2] = ($event) => $data.rawPage--),
          disabled: $data.rawPage <= 0
        }, "이전", 8, _hoisted_8),
        _createElementVNode("span", null, _toDisplayString($data.rawPage + 1) + " / " + _toDisplayString($options.totalPages), 1),
        _createElementVNode("button", {
          onClick: _cache[3] || (_cache[3] = ($event) => $data.rawPage++),
          disabled: $data.rawPage + 1 >= $options.totalPages
        }, "다음", 8, _hoisted_9)
      ]),
      $data.uploadPreviewColumns.length ? (_openBlock(), _createElementBlock("div", _hoisted_10, [
        _createElementVNode("div", _hoisted_11, [
          _createElementVNode("button", {
            class: "button-primary",
            onClick: _cache[4] || (_cache[4] = (...args) => $options.openDbSaveModal && $options.openDbSaveModal(...args))
          }, "DB에 저장"),
          _cache[34] || (_cache[34] = _createElementVNode("span", { style: { "color": "#888", "font-size": "14px", "align-self": "center" } }, " 데이터베이스에 저장하려면 버튼을 클릭하세요. ", -1))
        ])
      ])) : _createCommentVNode("", true),
      $data.showDbSaveModal ? (_openBlock(), _createElementBlock("div", _hoisted_12, [
        _createElementVNode("div", _hoisted_13, [
          _cache[37] || (_cache[37] = _createElementVNode("h4", null, "DB에 저장", -1)),
          _createElementVNode("label", null, [
            _cache[35] || (_cache[35] = _createTextVNode(" 테이블명: ")),
            _withDirectives(_createElementVNode("input", {
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.dbTableName = $event),
              placeholder: "예: ship_data_custom"
            }, null, 512), [
              [_vModelText, $data.dbTableName]
            ])
          ]),
          _createElementVNode("label", null, [
            _cache[36] || (_cache[36] = _createTextVNode(" 사용자명: ")),
            _withDirectives(_createElementVNode("input", {
              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.dbUserName = $event),
              placeholder: "예: 홍길동"
            }, null, 512), [
              [_vModelText, $data.dbUserName]
            ])
          ]),
          _createElementVNode("div", _hoisted_14, [
            _createElementVNode("button", {
              onClick: _cache[7] || (_cache[7] = (...args) => $options.saveCsvToDb && $options.saveCsvToDb(...args))
            }, "저장"),
            _createElementVNode("button", {
              onClick: _cache[8] || (_cache[8] = ($event) => $data.showDbSaveModal = false)
            }, "취소")
          ]),
          $data.dbSaveMessage ? (_openBlock(), _createElementBlock("div", _hoisted_15, _toDisplayString($data.dbSaveMessage), 1)) : _createCommentVNode("", true)
        ])
      ])) : _createCommentVNode("", true)
    ])) : _createCommentVNode("", true),
    $data.columns.length ? (_openBlock(), _createElementBlock("div", _hoisted_16, [
      _cache[43] || (_cache[43] = _createElementVNode("h2", null, "분석 항목 설정", -1)),
      _createElementVNode("div", _hoisted_17, [
        _createElementVNode("table", _hoisted_18, [
          _cache[40] || (_cache[40] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "변수명"),
              _createElementVNode("th", null, "포함 여부"),
              _createElementVNode("th", null, "항목(선택)")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.columns, (col) => {
              return _openBlock(), _createElementBlock("tr", { key: col }, [
                _createElementVNode("td", null, _toDisplayString(col), 1),
                _createElementVNode("td", null, [
                  _withDirectives(_createElementVNode("input", {
                    type: "checkbox",
                    "onUpdate:modelValue": ($event) => $data.fieldSchema[col].include = $event
                  }, null, 8, _hoisted_19), [
                    [_vModelCheckbox, $data.fieldSchema[col].include]
                  ])
                ]),
                _createElementVNode("td", null, [
                  _withDirectives(_createElementVNode("select", {
                    "onUpdate:modelValue": ($event) => $data.fieldSchema[col].selectedField = $event,
                    disabled: $data.fieldSchema[col].meta
                  }, [
                    _cache[39] || (_cache[39] = _createElementVNode("option", { value: "" }, "NaN", -1)),
                    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.itemOptions, (item) => {
                      return _openBlock(), _createElementBlock("option", {
                        key: item,
                        value: item
                      }, _toDisplayString(item), 9, _hoisted_21);
                    }), 128))
                  ], 8, _hoisted_20), [
                    [_vModelSelect, $data.fieldSchema[col].selectedField]
                  ])
                ])
              ]);
            }), 128))
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_22, [
        _createElementVNode("button", {
          class: "button-primary",
          onClick: _cache[9] || (_cache[9] = (...args) => $options.saveFieldSchema && $options.saveFieldSchema(...args)),
          disabled: $options.selectedFieldsCount === 0
        }, "설정 저장", 8, _hoisted_23),
        _createElementVNode("button", {
          class: "button-primary",
          style: { "margin-left": "8px" },
          onClick: _cache[10] || (_cache[10] = ($event) => $data.showFieldSchemaSaveModal = true),
          disabled: !$data.columns.length
        }, "DB 저장", 8, _hoisted_24),
        _createElementVNode("button", {
          class: "button-primary",
          style: { "margin-left": "8px" },
          onClick: _cache[11] || (_cache[11] = (...args) => $options.downloadSelectedMappingCSV && $options.downloadSelectedMappingCSV(...args)),
          disabled: !$data.columns.length
        }, " 선택 항목 CSV 다운로드", 8, _hoisted_25),
        $data.fieldSchemaError ? (_openBlock(), _createElementBlock("div", _hoisted_26, _toDisplayString($data.fieldSchemaError), 1)) : _createCommentVNode("", true)
      ]),
      _cache[44] || (_cache[44] = _createElementVNode("div", { style: { "color": "#5d5d5d", "margin-top": "8px", "font-size": "14px" } }, [
        _createTextVNode(" 각각의 변수를 선택해야 항목에 대한 그래프를 전부 볼 수 있습니다."),
        _createElementVNode("br"),
        _createTextVNode(" 분석 항목 설정에서 선택 하지 않을 시 그래프가 나오지 않습니다."),
        _createElementVNode("br"),
        _createTextVNode(" 분석 항목 설정에서 항목(선택) 후 설정 저장 해야 됩니다. ")
      ], -1)),
      $data.showFieldSchemaSaveModal ? (_openBlock(), _createElementBlock("div", _hoisted_27, [
        _createElementVNode("div", _hoisted_28, [
          _createElementVNode("label", null, [
            _cache[41] || (_cache[41] = _createTextVNode(" 테이블명: ")),
            _withDirectives(_createElementVNode("input", {
              "onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => $data.fieldSchemaTableName = $event),
              placeholder: "예: analysis_field_schema"
            }, null, 512), [
              [_vModelText, $data.fieldSchemaTableName]
            ])
          ]),
          _createElementVNode("label", null, [
            _cache[42] || (_cache[42] = _createTextVNode(" 사용자명: ")),
            _withDirectives(_createElementVNode("input", {
              "onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => $data.fieldSchemaUserName = $event),
              placeholder: "예: 홍길동"
            }, null, 512), [
              [_vModelText, $data.fieldSchemaUserName]
            ])
          ]),
          _createElementVNode("div", _hoisted_29, [
            _createElementVNode("button", {
              onClick: _cache[14] || (_cache[14] = (...args) => $options.saveFieldSchemaToDb && $options.saveFieldSchemaToDb(...args))
            }, "저장"),
            _createElementVNode("button", {
              onClick: _cache[15] || (_cache[15] = ($event) => $data.showFieldSchemaSaveModal = false)
            }, "취소")
          ]),
          $data.fieldSchemaError ? (_openBlock(), _createElementBlock("div", _hoisted_30, _toDisplayString($data.fieldSchemaError), 1)) : _createCommentVNode("", true)
        ])
      ])) : _createCommentVNode("", true),
      $data.saveMessage ? (_openBlock(), _createElementBlock("div", _hoisted_31, _toDisplayString($data.saveMessage), 1)) : _createCommentVNode("", true)
    ])) : _createCommentVNode("", true),
    $data.csvLoaded ? (_openBlock(), _createElementBlock("div", _hoisted_32, [
      _createElementVNode("label", null, [
        _cache[45] || (_cache[45] = _createTextVNode("시작 연도: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => $data.filters.start_year = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.years, (year) => {
            return _openBlock(), _createElementBlock("option", { key: year }, _toDisplayString(year), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.start_year]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[46] || (_cache[46] = _createTextVNode("시작 월: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => $data.filters.start_month = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (month) => {
            return _openBlock(), _createElementBlock("option", { key: month }, _toDisplayString(month), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.start_month]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[47] || (_cache[47] = _createTextVNode("종료 연도: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => $data.filters.end_year = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.years, (year) => {
            return _openBlock(), _createElementBlock("option", { key: year }, _toDisplayString(year), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.end_year]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[48] || (_cache[48] = _createTextVNode("종료 월: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => $data.filters.end_month = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (month) => {
            return _openBlock(), _createElementBlock("option", { key: month }, _toDisplayString(month), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.end_month]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[49] || (_cache[49] = _createTextVNode("선종: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => $data.filters.ship_type = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.shipTypes, (type) => {
            return _openBlock(), _createElementBlock("option", {
              key: type,
              value: type
            }, _toDisplayString($options.translate(type)), 9, _hoisted_33);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.ship_type]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[50] || (_cache[50] = _createTextVNode("호선: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => $data.filters.hull_number = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.filteredHullNumbers, (hull) => {
            return _openBlock(), _createElementBlock("option", {
              key: hull,
              value: hull
            }, _toDisplayString(hull), 9, _hoisted_34);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.hull_number]
        ])
      ]),
      _createElementVNode("button", {
        onClick: _cache[22] || (_cache[22] = (...args) => $options.applyFilters && $options.applyFilters(...args)),
        disabled: !$data.fieldSchemaSaved
      }, "필터 적용", 8, _hoisted_35),
      !$data.fieldSchemaSaved ? (_openBlock(), _createElementBlock("div", _hoisted_36, "분석 항목을 선택하고 저장한 후 필터를 적용해주세요.")) : _createCommentVNode("", true)
    ])) : _createCommentVNode("", true),
    _createElementVNode("div", _hoisted_37, [
      _cache[55] || (_cache[55] = _createElementVNode("h4", null, "비교용 선종/호선 선택 (선택 사항)", -1)),
      _createElementVNode("label", null, [
        _cache[52] || (_cache[52] = _createTextVNode("비교 선종: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => $data.compareFilters.ship_type = $event)
        }, [
          _cache[51] || (_cache[51] = _createElementVNode("option", { value: "" }, "비교 안함", -1)),
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.shipTypes, (type) => {
            return _openBlock(), _createElementBlock("option", {
              key: type,
              value: type
            }, _toDisplayString($options.translate(type)), 9, _hoisted_38);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.compareFilters.ship_type]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[54] || (_cache[54] = _createTextVNode("비교 호선: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[24] || (_cache[24] = ($event) => $data.compareFilters.hull_number = $event)
        }, [
          _cache[53] || (_cache[53] = _createElementVNode("option", { value: "" }, "-", -1)),
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.compareFilteredHullNumbers, (hull) => {
            return _openBlock(), _createElementBlock("option", {
              key: hull,
              value: hull
            }, _toDisplayString(hull), 9, _hoisted_39);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.compareFilters.hull_number]
        ])
      ]),
      _createElementVNode("button", {
        onClick: _cache[25] || (_cache[25] = (...args) => $options.applyFilters && $options.applyFilters(...args))
      }, "비교 적용")
    ]),
    !$data.filterApplied ? (_openBlock(), _createElementBlock("div", _hoisted_40, _cache[56] || (_cache[56] = [
      _createElementVNode("p", null, '필터를 먼저 선택하고 "필터 적용" 버튼을 눌러주세요.', -1)
    ]))) : (_openBlock(), _createElementBlock("div", _hoisted_41, [
      _withDirectives(_createElementVNode("div", _hoisted_42, "Loading data...", 512), [
        [_vShow, $data.loading]
      ])
    ])),
    $data.filterApplied ? (_openBlock(), _createElementBlock("div", _hoisted_43, [
      _createElementVNode("h3", null, "데이터 테이블 (" + _toDisplayString($data.filters.ship_type ? $options.translate($data.filters.ship_type) : "전체") + ")", 1),
      _createElementVNode("div", _hoisted_44, [
        _createElementVNode("table", _hoisted_45, [
          $options.pagedRecords.length > 0 ? (_openBlock(), _createElementBlock("thead", _hoisted_46, [
            _createElementVNode("tr", null, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.displayedColumns, (col) => {
                return _openBlock(), _createElementBlock("th", { key: col }, _toDisplayString(col), 1);
              }), 128))
            ])
          ])) : _createCommentVNode("", true),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.pagedRecords, (rec) => {
              return _openBlock(), _createElementBlock("tr", {
                key: rec.trial_id
              }, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.displayedColumns, (col) => {
                  return _openBlock(), _createElementBlock("td", { key: col }, _toDisplayString(col === "month_str" ? $options.formatMonth(rec[col]) : rec[col]), 1);
                }), 128))
              ]);
            }), 128))
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_47, [
        _createElementVNode("button", {
          onClick: _cache[26] || (_cache[26] = ($event) => $data.rawPage--),
          disabled: $data.rawPage <= 0
        }, "이전", 8, _hoisted_48),
        _createElementVNode("span", _hoisted_49, _toDisplayString($data.rawPage + 1) + " / " + _toDisplayString($options.totalPages), 1),
        _createElementVNode("button", {
          onClick: _cache[27] || (_cache[27] = ($event) => $data.rawPage++),
          disabled: $data.rawPage + 1 >= $options.totalPages
        }, "다음", 8, _hoisted_50)
      ]),
      _createElementVNode("button", {
        onClick: _cache[28] || (_cache[28] = (...args) => $options.downloadCSV && $options.downloadCSV(...args))
      }, "선택 컬럼 기준 CSV 다운로드"),
      _cache[79] || (_cache[79] = _createElementVNode("h3", null, "1. 월별 시운전 테스트 횟수", -1)),
      $data.filterApplied ? (_openBlock(), _createElementBlock("div", _hoisted_51, [
        _createElementVNode("canvas", _hoisted_52, null, 512)
      ])) : _createCommentVNode("", true),
      _createElementVNode("details", null, [
        _cache[58] || (_cache[58] = _createElementVNode("summary", null, "시운전 테스트 횟수 보기", -1)),
        _createElementVNode("table", _hoisted_53, [
          _cache[57] || (_cache[57] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "월"),
              _createElementVNode("th", null, "Normal"),
              _createElementVNode("th", null, "Delay"),
              _createElementVNode("th", null, "Total")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.pagedMonthlyTableData, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.month
              }, [
                _createElementVNode("td", null, _toDisplayString(row.month), 1),
                _createElementVNode("td", null, _toDisplayString(row.normal), 1),
                _createElementVNode("td", null, _toDisplayString(row.delay), 1),
                _createElementVNode("td", null, _toDisplayString(row.total), 1)
              ]);
            }), 128))
          ])
        ]),
        _createElementVNode("div", _hoisted_54, [
          _createElementVNode("button", {
            onClick: _cache[29] || (_cache[29] = ($event) => $data.monthlyTablePage--),
            disabled: $data.monthlyTablePage <= 0
          }, "이전", 8, _hoisted_55),
          _createElementVNode("span", null, _toDisplayString($data.monthlyTablePage + 1) + " / " + _toDisplayString($options.totalMonthlyTablePages), 1),
          _createElementVNode("button", {
            onClick: _cache[30] || (_cache[30] = ($event) => $data.monthlyTablePage++),
            disabled: $data.monthlyTablePage + 1 >= $options.totalMonthlyTablePages
          }, "다음", 8, _hoisted_56)
        ])
      ]),
      _createElementVNode("details", null, [
        _cache[60] || (_cache[60] = _createElementVNode("summary", null, "카운트 상세 보기", -1)),
        _createElementVNode("table", _hoisted_57, [
          _cache[59] || (_cache[59] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "상태"),
              _createElementVNode("th", null, "카운트"),
              _createElementVNode("th", null, "지연 시간")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.countSummaryData, (row, idx) => {
              return _openBlock(), _createElementBlock("tr", { key: idx }, [
                _createElementVNode("td", null, _toDisplayString(row.status), 1),
                _createElementVNode("td", null, _toDisplayString(row.count), 1),
                _createElementVNode("td", null, _toDisplayString(row.time || "-"), 1)
              ]);
            }), 128))
          ])
        ])
      ]),
      _cache[80] || (_cache[80] = _createElementVNode("h3", null, "2. 항목별 비용 분석", -1)),
      _createElementVNode("div", _hoisted_58, [
        _createElementVNode("canvas", _hoisted_59, null, 512)
      ]),
      _createElementVNode("details", null, [
        _cache[62] || (_cache[62] = _createElementVNode("summary", null, "비용 분석 결과 보기 (단위: 백만 원)", -1)),
        _createElementVNode("table", _hoisted_60, [
          _cache[61] || (_cache[61] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "Status"),
              _createElementVNode("th", null, "Fuel"),
              _createElementVNode("th", null, "Helm"),
              _createElementVNode("th", null, "Labor"),
              _createElementVNode("th", null, "Other"),
              _createElementVNode("th", null, "Total")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.getCostSummaryByStatus(), (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.status
              }, [
                _createElementVNode("td", null, _toDisplayString(row.status), 1),
                _createElementVNode("td", null, _toDisplayString(row.fuel_cost), 1),
                _createElementVNode("td", null, _toDisplayString(row.helm_tot_cost), 1),
                _createElementVNode("td", null, _toDisplayString(row.labor_cost), 1),
                _createElementVNode("td", null, _toDisplayString(row.other_cost), 1),
                _createElementVNode("td", null, _toDisplayString(row.total_cost), 1)
              ]);
            }), 128))
          ])
        ])
      ]),
      $data.filterApplied && $options.hasAnySelected ? (_openBlock(), _createElementBlock("h3", _hoisted_61, "3-1. 총경비 시계열 (Total Cost)")) : _createCommentVNode("", true),
      $data.filterApplied && $options.hasAnySelected ? (_openBlock(), _createElementBlock("div", _hoisted_62, [
        _createElementVNode("canvas", _hoisted_63, null, 512)
      ])) : _createCommentVNode("", true),
      $options.hasLaborSelected ? (_openBlock(), _createElementBlock("h3", _hoisted_64, "3-2. 인건비 시계열 (Labor Cost)")) : _createCommentVNode("", true),
      $options.hasLaborSelected ? (_openBlock(), _createElementBlock("div", _hoisted_65, [
        _createElementVNode("canvas", _hoisted_66, null, 512)
      ])) : _createCommentVNode("", true),
      $options.hasFuelSelected ? (_openBlock(), _createElementBlock("h3", _hoisted_67, "3-3. 유류비 시계열 (Fuel Cost)")) : _createCommentVNode("", true),
      $options.hasFuelSelected ? (_openBlock(), _createElementBlock("div", _hoisted_68, [
        _createElementVNode("canvas", _hoisted_69, null, 512)
      ])) : _createCommentVNode("", true),
      _cache[81] || (_cache[81] = _createElementVNode("h3", null, "4. 총 경비 예측", -1)),
      $options.hasLaborSelected ? (_openBlock(), _createElementBlock("h3", _hoisted_70, "4-1. 인건비 예측")) : _createCommentVNode("", true),
      $options.hasLaborSelected ? (_openBlock(), _createElementBlock("div", _hoisted_71, [
        _createElementVNode("canvas", _hoisted_72, null, 512)
      ])) : _createCommentVNode("", true),
      $options.hasLaborSelected && $data.predictedPersonnelTable.length ? (_openBlock(), _createElementBlock("details", _hoisted_73, [
        _cache[64] || (_cache[64] = _createElementVNode("summary", null, "인건비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_74, [
          _cache[63] || (_cache[63] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "Date"),
              _createElementVNode("th", null, "예측 인건비")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.predictedPersonnelTable, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.date
              }, [
                _createElementVNode("td", null, _toDisplayString(row.date), 1),
                _createElementVNode("td", null, _toDisplayString(row.value), 1)
              ]);
            }), 128))
          ])
        ])
      ])) : _createCommentVNode("", true),
      $options.hasOtherSelected ? (_openBlock(), _createElementBlock("h3", _hoisted_75, "4-2. 기타 비용 예측")) : _createCommentVNode("", true),
      $options.hasOtherSelected ? (_openBlock(), _createElementBlock("div", _hoisted_76, [
        _createElementVNode("canvas", _hoisted_77, null, 512)
      ])) : _createCommentVNode("", true),
      $options.hasOtherSelected && $data.predictedOtherTable.length ? (_openBlock(), _createElementBlock("details", _hoisted_78, [
        _cache[66] || (_cache[66] = _createElementVNode("summary", null, "기타 비용 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_79, [
          _cache[65] || (_cache[65] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "Date"),
              _createElementVNode("th", null, "예측 기타비용")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.predictedOtherTable, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.date
              }, [
                _createElementVNode("td", null, _toDisplayString(row.date), 1),
                _createElementVNode("td", null, _toDisplayString(row.value), 1)
              ]);
            }), 128))
          ])
        ])
      ])) : _createCommentVNode("", true),
      $options.hasFuelSelected ? (_openBlock(), _createElementBlock("h3", _hoisted_80, "4-3. 유류비 예측")) : _createCommentVNode("", true),
      $options.hasFuelSelected ? (_openBlock(), _createElementBlock("div", _hoisted_81, [
        _createElementVNode("canvas", _hoisted_82, null, 512)
      ])) : _createCommentVNode("", true),
      $options.hasFuelSelected && $data.predictedFuelTable.length ? (_openBlock(), _createElementBlock("details", _hoisted_83, [
        _cache[68] || (_cache[68] = _createElementVNode("summary", null, "유류비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_84, [
          _cache[67] || (_cache[67] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "Date"),
              _createElementVNode("th", null, "예측 유류비")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.predictedFuelTable, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.date
              }, [
                _createElementVNode("td", null, _toDisplayString(row.date), 1),
                _createElementVNode("td", null, _toDisplayString(row.value), 1)
              ]);
            }), 128))
          ])
        ])
      ])) : _createCommentVNode("", true),
      _cache[82] || (_cache[82] = _createElementVNode("h3", null, "4-4. 총 경비 예측", -1)),
      _createElementVNode("div", _hoisted_85, [
        _createElementVNode("canvas", _hoisted_86, null, 512)
      ]),
      _createElementVNode("details", null, [
        _cache[70] || (_cache[70] = _createElementVNode("summary", null, "총 경비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_87, [
          _cache[69] || (_cache[69] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "Date"),
              _createElementVNode("th", null, "예측 총 경비")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.predictedTotalTable, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.date
              }, [
                _createElementVNode("td", null, _toDisplayString(row.date), 1),
                _createElementVNode("td", null, _toDisplayString(row.value), 1)
              ]);
            }), 128))
          ])
        ])
      ]),
      _createElementVNode("div", _hoisted_88, [
        _cache[77] || (_cache[77] = _createElementVNode("h3", null, "5. 원인 분석", -1)),
        _createElementVNode("label", null, [
          _cache[71] || (_cache[71] = _createTextVNode("월 선택: ")),
          _withDirectives(_createElementVNode("select", {
            "onUpdate:modelValue": _cache[31] || (_cache[31] = ($event) => $data.selectedMonth = $event)
          }, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (m) => {
              return _openBlock(), _createElementBlock("option", {
                key: m,
                value: m
              }, _toDisplayString(parseInt(m)) + "월", 9, _hoisted_89);
            }), 128))
          ], 512), [
            [_vModelSelect, $data.selectedMonth]
          ])
        ]),
        _createElementVNode("button", {
          onClick: _cache[32] || (_cache[32] = (...args) => $options.loadCause && $options.loadCause(...args))
        }, "분석 실행"),
        $data.causeTable.length ? (_openBlock(), _createElementBlock("table", _hoisted_90, [
          _cache[72] || (_cache[72] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "항목"),
              _createElementVNode("th", null, "2024 평균"),
              _createElementVNode("th", null, "2025 예측"),
              _createElementVNode("th", null, "상승률(%)")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.causeTable, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.item
              }, [
                _createElementVNode("td", null, _toDisplayString(row.item), 1),
                _createElementVNode("td", null, _toDisplayString(row.avg_2024), 1),
                _createElementVNode("td", null, _toDisplayString(row.pred_2025), 1),
                _createElementVNode("td", {
                  class: _normalizeClass(row.dir)
                }, _toDisplayString(row.rateAbs), 3)
              ]);
            }), 128))
          ])
        ])) : _createCommentVNode("", true),
        $data.causeTable.length ? (_openBlock(), _createElementBlock("div", _hoisted_91, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.causeTable, (r) => {
            return _openBlock(), _createElementBlock("div", {
              class: "item-line",
              key: "line-" + r.item
            }, [
              _createElementVNode("b", null, _toDisplayString(r.item) + " :", 1),
              _createElementVNode("span", _hoisted_92, _toDisplayString(r.ment), 1),
              _createElementVNode("span", _hoisted_93, [
                _createTextVNode(_toDisplayString($options.formatMan(r.avg_2024)) + " → " + _toDisplayString($options.formatMan(r.pred_2025)) + " 만원 ", 1),
                _createElementVNode("span", {
                  class: _normalizeClass(["rate", r.dir])
                }, _toDisplayString(r.dir === "up" ? "▲" : "▼") + " " + _toDisplayString(r.rateAbs) + "% ", 3)
              ])
            ]);
          }), 128))
        ])) : _createCommentVNode("", true),
        $data.causeTable.length ? (_openBlock(), _createElementBlock("div", _hoisted_94, [
          _createElementVNode("div", _hoisted_95, [
            _cache[73] || (_cache[73] = _createElementVNode("b", null, "최대 변동:", -1)),
            _createElementVNode("span", _hoisted_96, _toDisplayString($data.maxChangeText), 1),
            _createElementVNode("span", _hoisted_97, [
              _createTextVNode(_toDisplayString($data.maxDetail.from) + " → " + _toDisplayString($data.maxDetail.to) + " 만원 ", 1),
              _createElementVNode("span", {
                class: _normalizeClass(["rate", $data.maxDetail.dir])
              }, _toDisplayString($data.maxDetail.dir === "up" ? "▲" : "▼") + " " + _toDisplayString($data.maxDetail.rateAbs) + "% ", 3)
            ])
          ]),
          _createElementVNode("div", _hoisted_98, [
            _cache[76] || (_cache[76] = _createElementVNode("b", null, "총경비:", -1)),
            _createElementVNode("span", _hoisted_99, _toDisplayString($data.totalMentLine), 1),
            _createElementVNode("span", _hoisted_100, [
              _createElementVNode("b", null, _toDisplayString($data.causeSummary.total.from), 1),
              _cache[74] || (_cache[74] = _createTextVNode(" → ")),
              _createElementVNode("b", null, _toDisplayString($data.causeSummary.total.to), 1),
              _cache[75] || (_cache[75] = _createTextVNode(" 만원 ")),
              _createElementVNode("span", {
                class: _normalizeClass(["rate", $data.causeSummary.total.dir])
              }, _toDisplayString($data.causeSummary.total.dir === "up" ? "▲" : "▼") + " " + _toDisplayString($data.causeSummary.total.rateAbs) + "% ", 3)
            ])
          ])
        ])) : _createCommentVNode("", true)
      ]),
      _cache[83] || (_cache[83] = _createElementVNode("h3", null, "6. 항목별 비용 특성 분석 (Radar Chart)", -1)),
      $options.hasAllFourSelected && $data.filterApplied ? (_openBlock(), _createElementBlock("div", _hoisted_101, [
        _createElementVNode("canvas", _hoisted_102, null, 512)
      ])) : (_openBlock(), _createElementBlock("div", _hoisted_103, _cache[78] || (_cache[78] = [
        _createElementVNode("small", { style: { "color": "#666" } }, [
          _createTextVNode(" 레이더 차트는 "),
          _createElementVNode("b", null, "Fuel/Labor/Other/Helm"),
          _createTextVNode(' 4개 항목을 모두 선택한 뒤 "설정 저장 → 필터 적용"을 하면 표시됩니다. ')
        ], -1)
      ])))
    ])) : _createCommentVNode("", true)
  ]);
}
const Analysis = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-51f2018f"]]);
export {
  Analysis as default
};
