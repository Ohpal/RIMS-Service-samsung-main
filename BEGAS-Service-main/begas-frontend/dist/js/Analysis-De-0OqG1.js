import { importShared } from "./__federation_fn_import-CByPomXo.js";
import { C as Chart, r as registerables, a as axios } from "./chart-DwolyZdg.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
Chart.register(...registerables);
const { nextTick } = await importShared("vue");
const _sfc_main = {
  name: "Analysis",
  data() {
    return {
      loading: true,
      years: [],
      months: [],
      shipTypes: [],
      filters: { start_year: "", start_month: "", end_year: "", end_month: "", ship_type: "" },
      rawRecords: [],
      costData: [],
      chartSrc: "",
      costChartSrc: "",
      seriesChartTotal: "",
      seriesChartPersonnel: "",
      seriesChartFuel: "",
      fuelPriceChartSrc: "",
      exchangeRateChartSrc: "",
      filterApplied: false,
      rawPage: 0,
      pageSize: 10,
      translationDict: {
        "1차_1차선": "1st_1st",
        "2차_1차선": "2nd_1st",
        "1차선": "1st",
        "시리즈": "Series"
      },
      monthlyTableData: [],
      countSummaryData: [],
      personnelPredictionChartSrc: "",
      // ★ 서버 차트 URL
      otherPredictionChartSrc: "",
      fuelChartSrc: "",
      totalPredictionChart: null,
      predictedPersonnelTable: [],
      predictedOtherTable: [],
      predictedFuelTable: [],
      predictedTotalTable: [],
      radarChartSrc: "",
      selectedMonth: "",
      causeTable: [],
      maxChangeText: ""
    };
  },
  computed: {
    rawTotalPages() {
      return Math.ceil(this.rawRecords.length / this.pageSize);
    },
    pagedRecords() {
      const start = this.rawPage * this.pageSize;
      return this.rawRecords.slice(start, start + this.pageSize);
    }
  },
  methods: {
    onPageChange(page) {
      this.rawPage = page - 1;
    },
    translate(n) {
      let r = n;
      for (const [k, v] of Object.entries(this.translationDict)) {
        r = r.replace(new RegExp(k, "g"), v);
      }
      return r;
    },
    formatMonth(s) {
      const [y, m] = s.split("-");
      return `${y}년 ${parseInt(m)}월`;
    },
    async loadData() {
      this.loading = true;
      try {
        const res = await axios.get("/analysis-api", { params: this.filters });
        this.rawRecords = res.data.records;
        this.chartSrc = `/analysis-api/chart?${new URLSearchParams(this.filters)}`;
        this.costChartSrc = `/analysis-api/cost-chart?${new URLSearchParams(this.filters)}`;
        const costRes = await axios.get("/analysis-api/cost-data", { params: this.filters });
        this.costData = costRes.data;
        const q = new URLSearchParams(this.filters);
        this.seriesChartTotal = `/analysis-api/cost-series?type=total&${q}`;
        this.seriesChartPersonnel = `/analysis-api/cost-series?type=personnel&${q}`;
        this.seriesChartFuel = `/analysis-api/cost-series?type=fuel&${q}`;
        this.fuelPriceChartSrc = `/analysis-api/fuel-price-chart?${q}`;
        this.exchangeRateChartSrc = `/analysis-api/exchange-rate-chart?${q}`;
        this.monthlyTableData = res.data.labels.map((m, i) => ({
          month: m,
          normal: res.data.normal_counts[i],
          delay: res.data.delay_counts[i],
          total: res.data.normal_counts[i] + res.data.delay_counts[i]
        }));
        this.countSummaryData = [
          { status: "Normal", count: this.monthlyTableData.reduce((a, r) => a + r.normal, 0) },
          { status: "Delay", count: this.monthlyTableData.reduce((a, r) => a + r.delay, 0) },
          { status: "Total", count: this.monthlyTableData.reduce((a, r) => a + r.total, 0) }
        ];
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },
    async loadPredictionCharts() {
      var _a, _b, _c, _d;
      this.personnelPredictionChartSrc = `/analysis-api/prediction/personnel?${new URLSearchParams(this.filters)}`;
      this.otherPredictionChartSrc = `/analysis-api/prediction/other?${new URLSearchParams(this.filters)}`;
      this.fuelChartSrc = `/analysis-api/prediction/fuel?${new URLSearchParams(this.filters)}`;
      const [pRes, oRes, fuelRes, totRes] = await Promise.all([
        axios.get("/analysis-api/prediction/personnel-data", { params: this.filters }),
        axios.get("/analysis-api/prediction/other-data", { params: this.filters }),
        axios.get("/analysis-api/prediction/fuel-data", { params: this.filters }),
        axios.get("/analysis-api/prediction/total", { params: this.filters })
      ]);
      this.predictedPersonnelTable = pRes.data.predicted_2025;
      this.predictedOtherTable = oRes.data.predicted_2025;
      this.predictedFuelTable = fuelRes.data.predicted_2025;
      this.predictedTotalTable = totRes.data.predicted_2025;
      await this.$nextTick();
      const actual = ((_a = totRes.data.actual) == null ? void 0 : _a.map((a) => parseFloat(a.value.replace(/[,원]/g, "")))) || [];
      const predicted = ((_b = totRes.data.predicted) == null ? void 0 : _b.map((p) => parseFloat(p.value.replace(/[,원]/g, "")))) || [];
      const labels = (((_c = totRes.data.actual) == null ? void 0 : _c.map((a) => a.date)) || []).concat(((_d = totRes.data.predicted) == null ? void 0 : _d.map((p) => p.date)) || []);
      const pdLine = Array(actual.length).fill(null).concat(predicted);
      let canvas = this.$refs.totalCostChart || document.getElementById("totalCostPredictionChart");
      if (!canvas) {
        await this.$nextTick();
        canvas = this.$refs.totalCostChart || document.getElementById("totalCostPredictionChart");
      }
      if (!canvas) {
        console.warn("총 경비 예측 차트 Canvas가 아직 DOM에 없음.");
        return;
      }
      const ctx = canvas.getContext("2d");
      if (this.totalPredictionChart) {
        this.totalPredictionChart.destroy();
      }
      if (labels.length > 0 && (actual.length > 0 || predicted.length > 0)) {
        this.totalPredictionChart = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Actual",
                data: actual,
                borderColor: "blue",
                backgroundColor: "transparent"
              },
              {
                label: "Predicted",
                data: pdLine,
                borderColor: "red",
                backgroundColor: "transparent",
                borderDash: [5, 5]
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true }
            },
            scales: {
              x: { display: true },
              y: { display: true }
            }
          }
        });
      } else {
        console.warn("총 경비 예측 데이터 없음 (차트 미생성)");
      }
    },
    applyFilters() {
      this.rawPage = 0;
      this.filterApplied = true;
      this.loadData();
      this.loadFuelCharts();
      this.loadRadarChart();
      this.loadPredictionCharts();
    },
    prevRaw() {
      if (this.rawPage > 0) this.rawPage--;
    },
    nextRaw() {
      if (this.rawPage + 1 < this.rawTotalPages) this.rawPage++;
    },
    async loadCause() {
      const params = { ...this.filters, month: this.selectedMonth };
      const res = await axios.get("/analysis-api/cause", { params });
      this.causeTable = res.data.table;
      this.maxChangeText = res.data.maxText;
    },
    loadFuelCharts() {
      const q = new URLSearchParams(this.filters);
      this.fuelPriceChartSrc = `/analysis-api/fuel-price-chart?${q}`;
      this.exchangeRateChartSrc = `/analysis-api/exchange-rate-chart?${q}`;
    },
    loadRadarChart() {
      this.radarChartSrc = `/analysis-api/cost-radar-chart?${new URLSearchParams(this.filters)}`;
    }
  },
  async mounted() {
    const cy = (/* @__PURE__ */ new Date()).getFullYear();
    for (let y = 2015; y <= cy; y++) this.years.push(String(y));
    for (let m = 1; m <= 12; m++) this.months.push(String(m).padStart(2, "0"));
    this.filters.start_year = this.years[this.years.length - 2];
    this.filters.start_month = this.months[0];
    this.filters.end_year = this.years[this.years.length - 1];
    this.filters.end_month = this.months[0];
    const res = await axios.get("/analysis-api", { params: this.filters });
    this.shipTypes = Array.from(new Set(res.data.records.map((r) => r.ship_type))).filter((x) => !!x);
  }
};
const { createElementVNode: _createElementVNode, renderList: _renderList, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock, toDisplayString: _toDisplayString, vModelSelect: _vModelSelect, withDirectives: _withDirectives, createTextVNode: _createTextVNode, createCommentVNode: _createCommentVNode, resolveComponent: _resolveComponent, createVNode: _createVNode } = await importShared("vue");
const _hoisted_1 = { class: "analysis-page" };
const _hoisted_2 = { class: "content-box" };
const _hoisted_3 = ["value"];
const _hoisted_4 = {
  key: 0,
  class: "waiting"
};
const _hoisted_5 = {
  key: 1,
  class: "loading"
};
const _hoisted_6 = { key: 2 };
const _hoisted_7 = { class: "raw-table-wrapper" };
const _hoisted_8 = { class: "raw-table" };
const _hoisted_9 = { class: "chart-container" };
const _hoisted_10 = ["src"];
const _hoisted_11 = { class: "data-frame" };
const _hoisted_12 = { class: "data-frame" };
const _hoisted_13 = { class: "chart-container" };
const _hoisted_14 = ["src"];
const _hoisted_15 = { class: "data-frame" };
const _hoisted_16 = { class: "chart-container" };
const _hoisted_17 = ["src"];
const _hoisted_18 = { class: "chart-container" };
const _hoisted_19 = ["src"];
const _hoisted_20 = { class: "chart-container" };
const _hoisted_21 = ["src"];
const _hoisted_22 = { class: "chart-container" };
const _hoisted_23 = ["src"];
const _hoisted_24 = { class: "data-frame" };
const _hoisted_25 = { class: "chart-container" };
const _hoisted_26 = ["src"];
const _hoisted_27 = { class: "data-frame" };
const _hoisted_28 = { class: "chart-container" };
const _hoisted_29 = ["src"];
const _hoisted_30 = { class: "data-frame" };
const _hoisted_31 = { class: "chart-container" };
const _hoisted_32 = ["src"];
const _hoisted_33 = { class: "chart-container" };
const _hoisted_34 = ["src"];
const _hoisted_35 = { class: "data-frame" };
const _hoisted_36 = { class: "content-box" };
const _hoisted_37 = ["value"];
const _hoisted_38 = { key: 0 };
const _hoisted_39 = { class: "data-frame" };
const _hoisted_40 = { class: "chart-container" };
const _hoisted_41 = ["src"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_a_pagination = _resolveComponent("a-pagination");
  return _openBlock(), _createElementBlock("div", _hoisted_1, [
    _cache[45] || (_cache[45] = _createElementVNode("h2", null, "해상 시운전 비용 분석", -1)),
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("label", null, [
        _cache[8] || (_cache[8] = _createTextVNode("시작 연도: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.filters.start_year = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.years, (year) => {
            return _openBlock(), _createElementBlock("option", { key: year }, _toDisplayString(year), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.start_year]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[9] || (_cache[9] = _createTextVNode("시작 월: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.filters.start_month = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (month) => {
            return _openBlock(), _createElementBlock("option", { key: month }, _toDisplayString(month), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.start_month]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[10] || (_cache[10] = _createTextVNode("종료 연도: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.filters.end_year = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.years, (year) => {
            return _openBlock(), _createElementBlock("option", { key: year }, _toDisplayString(year), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.end_year]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[11] || (_cache[11] = _createTextVNode("종료 월: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.filters.end_month = $event)
        }, [
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (month) => {
            return _openBlock(), _createElementBlock("option", { key: month }, _toDisplayString(month), 1);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.end_month]
        ])
      ]),
      _createElementVNode("label", null, [
        _cache[13] || (_cache[13] = _createTextVNode("선종: ")),
        _withDirectives(_createElementVNode("select", {
          "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.filters.ship_type = $event)
        }, [
          _cache[12] || (_cache[12] = _createElementVNode("option", { value: "" }, "전체", -1)),
          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.shipTypes, (type) => {
            return _openBlock(), _createElementBlock("option", {
              key: type,
              value: type
            }, _toDisplayString($options.translate(type)), 9, _hoisted_3);
          }), 128))
        ], 512), [
          [_vModelSelect, $data.filters.ship_type]
        ])
      ]),
      _createElementVNode("button", {
        onClick: _cache[5] || (_cache[5] = (...args) => $options.applyFilters && $options.applyFilters(...args))
      }, "필터 적용")
    ]),
    !$data.filterApplied ? (_openBlock(), _createElementBlock("div", _hoisted_4, _cache[14] || (_cache[14] = [
      _createElementVNode("p", null, '필터를 먼저 선택하고 "필터 적용" 버튼을 눌러주세요.', -1)
    ]))) : _createCommentVNode("", true),
    $data.loading ? (_openBlock(), _createElementBlock("div", _hoisted_5, "Loading data...")) : (_openBlock(), _createElementBlock("div", _hoisted_6, [
      _createElementVNode("h3", null, "데이터 테이블 (" + _toDisplayString($data.filters.ship_type ? $options.translate($data.filters.ship_type) : "전체") + ")", 1),
      _createElementVNode("div", _hoisted_7, [
        _createElementVNode("table", _hoisted_8, [
          _cache[15] || (_cache[15] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "ID"),
              _createElementVNode("th", null, "검사일자"),
              _createElementVNode("th", null, "선종"),
              _createElementVNode("th", null, "지연 여부")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.pagedRecords, (rec) => {
              return _openBlock(), _createElementBlock("tr", {
                key: rec.trial_id
              }, [
                _createElementVNode("td", null, _toDisplayString(rec.trial_id), 1),
                _createElementVNode("td", null, _toDisplayString($options.formatMonth(rec.month_str)), 1),
                _createElementVNode("td", null, _toDisplayString($options.translate(rec.ship_type)), 1),
                _createElementVNode("td", null, _toDisplayString(rec.delay_yn), 1)
              ]);
            }), 128))
          ])
        ])
      ]),
      _createVNode(_component_a_pagination, {
        current: $data.rawPage + 1,
        "page-size": $data.pageSize,
        total: $data.rawRecords.length,
        onChange: $options.onPageChange,
        "show-less-items": "",
        class: "custom-pagination"
      }, null, 8, ["current", "page-size", "total", "onChange"]),
      _cache[33] || (_cache[33] = _createElementVNode("h3", null, "1. 월별 시운전 테스트 횟수", -1)),
      _createElementVNode("div", _hoisted_9, [
        _createElementVNode("img", {
          src: $data.chartSrc,
          alt: "Monthly Operations"
        }, null, 8, _hoisted_10)
      ]),
      _createElementVNode("details", null, [
        _cache[17] || (_cache[17] = _createElementVNode("summary", null, "시운전 테스트 횟수 보기", -1)),
        _createElementVNode("table", _hoisted_11, [
          _cache[16] || (_cache[16] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "월"),
              _createElementVNode("th", null, "Normal"),
              _createElementVNode("th", null, "Delay"),
              _createElementVNode("th", null, "Total")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.monthlyTableData, (row) => {
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
        ])
      ]),
      _createElementVNode("details", null, [
        _cache[19] || (_cache[19] = _createElementVNode("summary", null, "카운트 상세 보기", -1)),
        _createElementVNode("table", _hoisted_12, [
          _cache[18] || (_cache[18] = _createElementVNode("thead", null, [
            _createElementVNode("tr", null, [
              _createElementVNode("th", null, "상태"),
              _createElementVNode("th", null, "카운트")
            ])
          ], -1)),
          _createElementVNode("tbody", null, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.countSummaryData, (row) => {
              return _openBlock(), _createElementBlock("tr", {
                key: row.status
              }, [
                _createElementVNode("td", null, _toDisplayString(row.status), 1),
                _createElementVNode("td", null, _toDisplayString(row.count), 1)
              ]);
            }), 128))
          ])
        ])
      ]),
      _cache[34] || (_cache[34] = _createElementVNode("h3", null, "2. 항목별 비용 분석", -1)),
      _createElementVNode("div", _hoisted_13, [
        _createElementVNode("img", {
          src: $data.costChartSrc,
          alt: "Cost Analysis"
        }, null, 8, _hoisted_14)
      ]),
      _createElementVNode("details", null, [
        _cache[21] || (_cache[21] = _createElementVNode("summary", null, "비용 분석 결과 보기 (단위: 백만 원)", -1)),
        _createElementVNode("table", _hoisted_15, [
          _cache[20] || (_cache[20] = _createElementVNode("thead", null, [
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
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.costData, (row) => {
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
      _cache[35] || (_cache[35] = _createElementVNode("h3", null, "3. 정상/지연 항목별 비용 분석", -1)),
      _createElementVNode("div", _hoisted_16, [
        _createElementVNode("img", {
          src: $data.seriesChartTotal,
          alt: "Total Cost Over Time"
        }, null, 8, _hoisted_17)
      ]),
      _createElementVNode("div", _hoisted_18, [
        _createElementVNode("img", {
          src: $data.seriesChartPersonnel,
          alt: "Personnel Over Time"
        }, null, 8, _hoisted_19)
      ]),
      _createElementVNode("div", _hoisted_20, [
        _createElementVNode("img", {
          src: $data.seriesChartFuel,
          alt: "Fuel Cost Over Time"
        }, null, 8, _hoisted_21)
      ]),
      _cache[36] || (_cache[36] = _createElementVNode("h3", null, "4. 총 경비 예측", -1)),
      _cache[37] || (_cache[37] = _createElementVNode("h3", null, "4-1. 인건비 예측", -1)),
      _createElementVNode("div", _hoisted_22, [
        _createElementVNode("img", {
          src: $data.personnelPredictionChartSrc,
          alt: "인건비 예측"
        }, null, 8, _hoisted_23)
      ]),
      _createElementVNode("details", null, [
        _cache[23] || (_cache[23] = _createElementVNode("summary", null, "인건비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_24, [
          _cache[22] || (_cache[22] = _createElementVNode("thead", null, [
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
      ]),
      _cache[38] || (_cache[38] = _createElementVNode("h3", null, "4-2. 기타 비용 예측", -1)),
      _createElementVNode("div", _hoisted_25, [
        _createElementVNode("img", {
          src: $data.otherPredictionChartSrc,
          alt: "기타비용 예측"
        }, null, 8, _hoisted_26)
      ]),
      _createElementVNode("details", null, [
        _cache[25] || (_cache[25] = _createElementVNode("summary", null, "기타 비용 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_27, [
          _cache[24] || (_cache[24] = _createElementVNode("thead", null, [
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
      ]),
      _cache[39] || (_cache[39] = _createElementVNode("h3", null, "4-3. 유류비 예측", -1)),
      _createElementVNode("div", _hoisted_28, [
        _createElementVNode("img", {
          src: $data.fuelChartSrc,
          alt: "유류비 예측"
        }, null, 8, _hoisted_29)
      ]),
      _createElementVNode("details", null, [
        _cache[27] || (_cache[27] = _createElementVNode("summary", null, "유류비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_30, [
          _cache[26] || (_cache[26] = _createElementVNode("thead", null, [
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
      ]),
      _cache[40] || (_cache[40] = _createElementVNode("h3", null, "4-4. 유가 단가(HFO/MFO) 예측", -1)),
      _createElementVNode("div", _hoisted_31, [
        _createElementVNode("img", {
          src: $data.fuelPriceChartSrc,
          alt: "Fuel Price Prediction"
        }, null, 8, _hoisted_32)
      ]),
      _cache[41] || (_cache[41] = _createElementVNode("h3", null, "4-5. 환율 예측", -1)),
      _createElementVNode("div", _hoisted_33, [
        _createElementVNode("img", {
          src: $data.exchangeRateChartSrc,
          alt: "Exchange Rate Prediction"
        }, null, 8, _hoisted_34)
      ]),
      _cache[42] || (_cache[42] = _createElementVNode("h3", null, "4-6. 총 경비 예측", -1)),
      _cache[43] || (_cache[43] = _createElementVNode("div", { class: "chart-container" }, [
        _createElementVNode("canvas", { id: "totalCostPredictionChart" })
      ], -1)),
      _createElementVNode("details", null, [
        _cache[29] || (_cache[29] = _createElementVNode("summary", null, "총 경비 예측 결과 테이블 보기 (2025년)", -1)),
        _createElementVNode("table", _hoisted_35, [
          _cache[28] || (_cache[28] = _createElementVNode("thead", null, [
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
      _createElementVNode("div", _hoisted_36, [
        _cache[32] || (_cache[32] = _createElementVNode("h3", null, "5. 원인 분석", -1)),
        _createElementVNode("label", null, [
          _cache[30] || (_cache[30] = _createTextVNode("월 선택: ")),
          _withDirectives(_createElementVNode("select", {
            "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.selectedMonth = $event)
          }, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.months, (m) => {
              return _openBlock(), _createElementBlock("option", {
                key: m,
                value: m
              }, _toDisplayString(parseInt(m)) + "월", 9, _hoisted_37);
            }), 128))
          ], 512), [
            [_vModelSelect, $data.selectedMonth]
          ])
        ]),
        _createElementVNode("button", {
          onClick: _cache[7] || (_cache[7] = (...args) => $options.loadCause && $options.loadCause(...args))
        }, "분석 실행"),
        $data.causeTable.length ? (_openBlock(), _createElementBlock("div", _hoisted_38, [
          _createElementVNode("table", _hoisted_39, [
            _cache[31] || (_cache[31] = _createElementVNode("thead", null, [
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
                  _createElementVNode("td", null, _toDisplayString(row.rate), 1)
                ]);
              }), 128))
            ])
          ]),
          _createElementVNode("p", null, _toDisplayString($data.maxChangeText), 1)
        ])) : _createCommentVNode("", true)
      ]),
      _cache[44] || (_cache[44] = _createElementVNode("h3", null, "6. 항목별 비용 특성 분석 (Radar Chart)", -1)),
      _createElementVNode("div", _hoisted_40, [
        _createElementVNode("img", {
          src: $data.radarChartSrc,
          alt: "Cost Radar Chart"
        }, null, 8, _hoisted_41)
      ])
    ]))
  ]);
}
const Analysis = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7bba1f76"]]);
export {
  Analysis as default
};
