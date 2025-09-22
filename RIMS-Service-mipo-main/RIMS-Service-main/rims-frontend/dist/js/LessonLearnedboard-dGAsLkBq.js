import { importShared } from "./__federation_fn_import-Dc6jQS63.js";
import WriteLessonlearned from "./WriteLessonlearned-Ob4TaWIV.js";
import { L as LessonlearnedService } from "./LessonlearnedService-BcAnp7nQ.js";
import { _ as _export_sfc } from "./_plugin-vue_export-helper-1tPrXgE0.js";
const _sfc_main$1 = {
  name: "ShowLessonlearned",
  props: {
    setData: {
      type: Object,
      default: () => ({})
    },
    setFile: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      editMode: false,
      formData: {},
      // 초기에는 빈 객체로 설정
      show: false,
      message: {
        type: String,
        deafult: "저장이 완료되었습니다!"
      },
      files: []
      // 업로드할 파일 리스트
    };
  },
  watch: {
    setData: {
      handler(newValue) {
        this.formData = { ...newValue };
      },
      immediate: true,
      // 컴포넌트가 로드될 때도 바로 호출되도록 설정
      deep: true
      // setData의 깊은 속성 변화까지 감지
    }
  },
  computed: {
    format_date() {
      const project_dated = new Date(this.setData.project_date);
      const year = project_dated.getFullYear();
      const month = String(project_dated.getMonth() + 1).padStart(2, "0");
      const day = String(project_dated.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  },
  methods: {
    // 기존 모달 데이터 출력
    async downloadFileList(id, name) {
      try {
        const response = await LessonlearnedService.downloadFile(id, name, {
          responseType: "blob"
        });
        if (response.status !== 200) {
          throw new Error("파일을 다운로드하는 동안 오류가 발생했습니다.");
        }
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", name);
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        link.remove();
      } catch (error) {
        console.error("파일 다운로드 오류:", error);
      }
    },
    file_divide(file) {
      if (!file || !file.filename || !file.filesize) return "정보 없음";
      const fSExt = ["Bytes", "KB", "MB", "GB"];
      let file_name = file.filename;
      let file_size = file.filesize;
      let i = 0;
      let checkSize = file_size;
      while (checkSize > 900) {
        checkSize /= 1024;
        i++;
      }
      checkSize = Math.round(checkSize * 100) / 100 + " " + fSExt[i];
      return `${file_name} (${checkSize})`;
    },
    file_type(type) {
      switch (type) {
        case "jpg":
        case "png":
          return "../assets/image/image_icon.png";
        case "pdf":
          return "../assets/image/pdf_icon.png";
        case "hwp":
        case "hwpx":
          return "../assets/image/hwp_icon.png";
        case "zip":
          return "../assets/image/zip_icon.png";
        default:
          return "../assets/image/other_icon.png";
      }
    },
    //====================수정하기 버튼 작업===============
    toggleEditMode() {
      this.editMode = !this.editMode;
      if (!this.editMode) {
        this.formData = { ...this.setData };
      }
    },
    async saveChanges() {
      try {
        await LessonlearnedService.update(this.formData);
        this.$emit("update", this.formData);
        this.editMode = false;
        this.showToast();
      } catch (error) {
        console.error("저장 중 오류 발생:", error);
      }
    },
    // 토스트 메세지 표시
    showToast() {
      this.show = true;
      setTimeout(() => {
        this.show = false;
      }, 2500);
    }
  }
};
const { toDisplayString: _toDisplayString$1, createElementVNode: _createElementVNode$1, vModelText: _vModelText$1, withDirectives: _withDirectives$1, vModelSelect: _vModelSelect, renderList: _renderList$1, Fragment: _Fragment$1, openBlock: _openBlock$1, createElementBlock: _createElementBlock$1, createTextVNode: _createTextVNode$1, createCommentVNode: _createCommentVNode$1, createStaticVNode: _createStaticVNode } = await importShared("vue");
const _hoisted_1$1 = {
  class: "modal fade",
  id: "list_modal",
  tabindex: "-1",
  "aria-labelledby": "list_modal_Label",
  "aria-hidden": "true"
};
const _hoisted_2$1 = { class: "modal-dialog modal-dialog-scrollable" };
const _hoisted_3$1 = { class: "modal-content" };
const _hoisted_4$1 = { class: "modal-header" };
const _hoisted_5$1 = {
  class: "modal-title fs-5",
  id: "list_modal_Label"
};
const _hoisted_6$1 = { class: "modal-body" };
const _hoisted_7$1 = { class: "form-group" };
const _hoisted_8$1 = { class: "row" };
const _hoisted_9$1 = { class: "col" };
const _hoisted_10$1 = ["readonly"];
const _hoisted_11$1 = { class: "col" };
const _hoisted_12$1 = ["readonly"];
const _hoisted_13$1 = { class: "row" };
const _hoisted_14$1 = { class: "col" };
const _hoisted_15$1 = ["readonly"];
const _hoisted_16$1 = { class: "col" };
const _hoisted_17$1 = ["readonly"];
const _hoisted_18$1 = { class: "row" };
const _hoisted_19$1 = { class: "col-md" };
const _hoisted_20$1 = ["disabled"];
const _hoisted_21$1 = { class: "col-md" };
const _hoisted_22$1 = ["readonly"];
const _hoisted_23$1 = { class: "row" };
const _hoisted_24$1 = { class: "col-md" };
const _hoisted_25$1 = ["readonly"];
const _hoisted_26$1 = { class: "row" };
const _hoisted_27$1 = { class: "col-md" };
const _hoisted_28 = ["readonly"];
const _hoisted_29 = { class: "row" };
const _hoisted_30 = { class: "col-md" };
const _hoisted_31 = { for: "FileInput" };
const _hoisted_32 = { class: "ll_value form-control overflow" };
const _hoisted_33 = { key: 0 };
const _hoisted_34 = ["onClick"];
const _hoisted_35 = ["src"];
const _hoisted_36 = { key: 1 };
const _hoisted_37 = ["disabled"];
const _hoisted_38 = { class: "modal-footer" };
const _hoisted_39 = {
  key: 0,
  type: "button",
  class: "btn btn-secondary",
  "data-bs-dismiss": "modal"
};
const _hoisted_40 = { class: "toast-container position-fixed top-50 start-50 translate-middle p-3" };
const _hoisted_41 = {
  key: 0,
  class: "toast show custom-toast align-items-center",
  role: "alert",
  "aria-live": "assertive",
  "aria-atomic": "true"
};
const _hoisted_42 = { class: "d-flex" };
const _hoisted_43 = { class: "toast-body" };
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return _openBlock$1(), _createElementBlock$1(_Fragment$1, null, [
    _createElementVNode$1("div", _hoisted_1$1, [
      _createElementVNode$1("div", _hoisted_2$1, [
        _createElementVNode$1("div", _hoisted_3$1, [
          _createElementVNode$1("div", _hoisted_4$1, [
            _createElementVNode$1("h1", _hoisted_5$1, "시운전 지식 정보(no." + _toDisplayString$1($props.setData.id) + ")", 1),
            _cache[12] || (_cache[12] = _createElementVNode$1("button", {
              type: "button",
              class: "btn-close",
              "data-bs-dismiss": "modal",
              "aria-label": "Close"
            }, null, -1))
          ]),
          _createElementVNode$1("div", _hoisted_6$1, [
            _createElementVNode$1("div", _hoisted_7$1, [
              _createElementVNode$1("div", _hoisted_8$1, [
                _createElementVNode$1("div", _hoisted_9$1, [
                  _cache[13] || (_cache[13] = _createElementVNode$1("label", { for: "ProjectNameInput" }, "프로젝트명", -1)),
                  _withDirectives$1(_createElementVNode$1("input", {
                    type: "text",
                    class: "ll_value form-control",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.formData.project_title = $event),
                    readonly: !$data.editMode
                  }, null, 8, _hoisted_10$1), [
                    [_vModelText$1, $data.formData.project_title]
                  ])
                ]),
                _createElementVNode$1("div", _hoisted_11$1, [
                  _cache[14] || (_cache[14] = _createElementVNode$1("label", { for: "DateInput" }, "작성날짜", -1)),
                  _withDirectives$1(_createElementVNode$1("input", {
                    type: "date",
                    class: "ll_value form-control",
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $options.format_date = $event),
                    readonly: !$data.editMode
                  }, null, 8, _hoisted_12$1), [
                    [_vModelText$1, $options.format_date]
                  ])
                ])
              ]),
              _createElementVNode$1("div", _hoisted_13$1, [
                _createElementVNode$1("div", _hoisted_14$1, [
                  _cache[15] || (_cache[15] = _createElementVNode$1("label", { for: "DepartmentInput" }, "부서", -1)),
                  _withDirectives$1(_createElementVNode$1("input", {
                    type: "text",
                    class: "ll_value form-control",
                    "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.formData.project_department = $event),
                    readonly: !$data.editMode
                  }, null, 8, _hoisted_15$1), [
                    [_vModelText$1, $data.formData.project_department]
                  ])
                ]),
                _createElementVNode$1("div", _hoisted_16$1, [
                  _cache[16] || (_cache[16] = _createElementVNode$1("label", { for: "CommanderInput" }, "작성자", -1)),
                  _withDirectives$1(_createElementVNode$1("input", {
                    type: "text",
                    class: "ll_value form-control",
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.formData.project_commander = $event),
                    readonly: !$data.editMode
                  }, null, 8, _hoisted_17$1), [
                    [_vModelText$1, $data.formData.project_commander]
                  ])
                ])
              ]),
              _createElementVNode$1("div", _hoisted_18$1, [
                _createElementVNode$1("div", _hoisted_19$1, [
                  _cache[18] || (_cache[18] = _createElementVNode$1("label", { for: "PartInput" }, "시운전파트", -1)),
                  _withDirectives$1(_createElementVNode$1("select", {
                    class: "ll_value form-select",
                    "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.formData.project_part = $event),
                    disabled: !$data.editMode
                  }, _cache[17] || (_cache[17] = [
                    _createStaticVNode('<option selected data-v-3221e374>Select Part</option><option value="general" data-v-3221e374>General Part</option><option value="hull" data-v-3221e374>HULL Part</option><option value="machinery" data-v-3221e374>Machinery Part</option><option value="electric" data-v-3221e374>Electric Part</option><option value="accommodation" data-v-3221e374>Accommodation Part</option><option value="outfitting" data-v-3221e374>Outfitting Part</option>', 7)
                  ]), 8, _hoisted_20$1), [
                    [_vModelSelect, $data.formData.project_part]
                  ])
                ]),
                _createElementVNode$1("div", _hoisted_21$1, [
                  _cache[19] || (_cache[19] = _createElementVNode$1("label", { for: "DescriptionInput" }, "시운전항목", -1)),
                  _withDirectives$1(_createElementVNode$1("input", {
                    type: "text",
                    class: "ll_value form-control",
                    "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.formData.project_description = $event),
                    readonly: !$data.editMode
                  }, null, 8, _hoisted_22$1), [
                    [_vModelText$1, $data.formData.project_description]
                  ])
                ])
              ])
            ]),
            _createElementVNode$1("div", _hoisted_23$1, [
              _createElementVNode$1("div", _hoisted_24$1, [
                _cache[20] || (_cache[20] = _createElementVNode$1("label", { for: "ProblemInput" }, "발생이슈", -1)),
                _withDirectives$1(_createElementVNode$1("textarea", {
                  class: "ll_value form-control",
                  rows: "4",
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $data.formData.project_issue = $event),
                  readonly: !$data.editMode
                }, null, 8, _hoisted_25$1), [
                  [_vModelText$1, $data.formData.project_issue]
                ])
              ])
            ]),
            _createElementVNode$1("div", _hoisted_26$1, [
              _createElementVNode$1("div", _hoisted_27$1, [
                _cache[21] || (_cache[21] = _createElementVNode$1("label", { for: "ActionResultInput" }, "조치결과", -1)),
                _withDirectives$1(_createElementVNode$1("textarea", {
                  class: "ll_value form-control",
                  rows: "4",
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $data.formData.project_actionresult = $event),
                  readonly: !$data.editMode
                }, null, 8, _hoisted_28), [
                  [_vModelText$1, $data.formData.project_actionresult]
                ])
              ])
            ]),
            _createElementVNode$1("div", _hoisted_29, [
              _createElementVNode$1("div", _hoisted_30, [
                _createElementVNode$1("label", _hoisted_31, "첨부파일 (" + _toDisplayString$1($props.setFile.length) + "개)", 1),
                _createElementVNode$1("div", _hoisted_32, [
                  $props.setFile.length > 0 ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_33, [
                    _createElementVNode$1("ul", null, [
                      (_openBlock$1(true), _createElementBlock$1(_Fragment$1, null, _renderList$1($props.setFile, (file, index) => {
                        return _openBlock$1(), _createElementBlock$1("li", {
                          key: file.id ? file.id + "_" + index : index
                        }, [
                          _createElementVNode$1("a", {
                            class: "link-primary pe-auto cursor",
                            onClick: ($event) => $options.downloadFileList(file.id, file.filename)
                          }, [
                            _createElementVNode$1("img", {
                              src: $options.file_type(file.mimetype),
                              width: "20",
                              height: "20"
                            }, null, 8, _hoisted_35),
                            _createTextVNode$1(" " + _toDisplayString$1($options.file_divide(file)), 1)
                          ], 8, _hoisted_34)
                        ]);
                      }), 128))
                    ])
                  ])) : (_openBlock$1(), _createElementBlock$1("div", _hoisted_36, [
                    _createElementVNode$1("input", {
                      type: "file",
                      onChange: _cache[8] || (_cache[8] = (...args) => _ctx.handleFileUpload && _ctx.handleFileUpload(...args)),
                      multiple: "",
                      disabled: !$data.editMode
                    }, null, 40, _hoisted_37)
                  ]))
                ])
              ])
            ])
          ]),
          _createElementVNode$1("div", _hoisted_38, [
            !$data.editMode ? (_openBlock$1(), _createElementBlock$1("button", _hoisted_39, "닫  기")) : _createCommentVNode$1("", true),
            $data.editMode ? (_openBlock$1(), _createElementBlock$1("button", {
              key: 1,
              type: "button",
              class: "btn btn-secondary",
              onClick: _cache[9] || (_cache[9] = (...args) => $options.toggleEditMode && $options.toggleEditMode(...args))
            }, "취  소")) : _createCommentVNode$1("", true),
            !$data.editMode ? (_openBlock$1(), _createElementBlock$1("button", {
              key: 2,
              type: "button",
              class: "btn btn-primary",
              onClick: _cache[10] || (_cache[10] = (...args) => $options.toggleEditMode && $options.toggleEditMode(...args))
            }, "수정하기")) : _createCommentVNode$1("", true),
            $data.editMode ? (_openBlock$1(), _createElementBlock$1("button", {
              key: 3,
              type: "button",
              class: "btn btn-success",
              onClick: _cache[11] || (_cache[11] = (...args) => $options.saveChanges && $options.saveChanges(...args))
            }, "저장하기")) : _createCommentVNode$1("", true)
          ])
        ])
      ])
    ]),
    _createElementVNode$1("div", _hoisted_40, [
      $data.show ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_41, [
        _createElementVNode$1("div", _hoisted_42, [
          _cache[22] || (_cache[22] = _createElementVNode$1("div", { class: "toast-icon align-items-center" }, [
            _createElementVNode$1("svg", {
              xmlns: "http://www.w3.org/2000/svg",
              width: "20",
              height: "20",
              fill: "currentColor",
              class: "bi bi-check-circle-fill",
              viewBox: "0 0 16 16"
            }, [
              _createElementVNode$1("path", { d: "M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" })
            ])
          ], -1)),
          _createElementVNode$1("div", _hoisted_43, _toDisplayString$1($data.message.deafult), 1)
        ])
      ])) : _createCommentVNode$1("", true)
    ])
  ], 64);
}
const ShowLessonlearned = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__scopeId", "data-v-3221e374"]]);
const _imports_0 = "./../media/notfound-Bt9uQNvd.notfound.png";
const _sfc_main = {
  components: { WriteLessonlearned, ShowLessonlearned },
  name: "LessonLearned",
  data() {
    return {
      currentLessonlearned: null,
      message: "",
      lessonlearned_list: [],
      file_list: [],
      currentIndex: -1,
      setDatas: {},
      // ← 객체로 초기화
      setFiles: [],
      keywords: ["#전 체", "#안 벽", "#기 관", "#선 장", "#전 장", "#해 상", "#GENERAL", "#HULL", "#MACHINERY", "#ELECTRIC", "#ACCOMMODATION", "#OUTFITTING"],
      search_issue: "",
      loading: true,
      load_error: null,
      select_empty: false,
      sortOption: "최신순"
    };
  },
  computed: {
    sortedLessonlearnedList() {
      const list = [...this.lessonlearned_list];
      if (this.sortOption === "조회순") {
        return list.sort((a, b) => Number(b.project_views ?? 0) - Number(a.project_views ?? 0));
      } else if (this.sortOption === "최신순") {
        return list.sort((a, b) => new Date(b.project_date) - new Date(a.project_date));
      } else if (this.sortOption === "등록순") {
        return list.sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0));
      }
      return list;
    }
  },
  methods: {
    // 전체 Select (동시 호출 후 로딩 종료)
    async retrieveLessonLearned() {
      try {
        this.loading = true;
        this.load_error = null;
        this.select_empty = false;
        const [listRes, fileRes] = await Promise.all([LessonlearnedService.selectAll(), LessonlearnedService.selectFile()]);
        this.lessonlearned_list = (listRes == null ? void 0 : listRes.data) ?? [];
        this.file_list = (fileRes == null ? void 0 : fileRes.data) ?? [];
      } catch (e) {
        this.load_error = "게시물을 불러오는 중 오류가 발생하였습니다.";
        console.log("retrieveLessonLearned>>", e);
      } finally {
        this.loading = false;
      }
    },
    // 검색 List 정렬 옵션 업데이트
    updateSortOption(option) {
      this.sortOption = option;
    },
    /*--------------------------------------------------------*/
    // 검색 Select
    async searchLessonlearned() {
      this.loading = true;
      this.load_error = null;
      this.select_empty = false;
      const q = (this.search_issue ?? "").trim();
      if (!q) {
        this.loading = false;
        alert("시운전 검색어를 입력하세요.");
        return;
      }
      try {
        const response = await LessonlearnedService.selectELK(q);
        this.lessonlearned_list = response.data ?? [];
        this.setActiveLessonleanred(null);
        this.select_empty = this.lessonlearned_list.length === 0;
      } catch (e) {
        this.load_error = "게시물을 불러오는 중 오류가 발생하였습니다.";
        console.log("searchLessonlearned ERR>>", e);
      } finally {
        this.loading = false;
      }
    },
    // 카테고리 Select
    async keyword_select(event) {
      try {
        this.loading = true;
        this.load_error = null;
        this.select_empty = false;
        let btn_text = event.target.textContent || "";
        btn_text = btn_text.replace("#", "").replace(/\s+/g, "");
        if (btn_text === "전체") {
          await this.retrieveLessonLearned();
        } else {
          const response = await LessonlearnedService.selectELK(btn_text);
          this.lessonlearned_list = response.data ?? [];
          this.setActiveLessonleanred(null);
          this.select_empty = this.lessonlearned_list.length === 0;
        }
      } catch (e) {
        this.load_error = "게시물을 불러오는 중 오류가 발생하였습니다.";
        console.log("keyword_select>>", e);
      } finally {
        this.loading = false;
      }
    },
    // 엔터키를 통한 검색
    async handleSubmit() {
      this.searchLessonlearned();
    },
    // 리스트 화면 갱신
    refreshList() {
      this.retrieveLessonLearned();
      this.currentLessonlearned = null;
      this.currentIndex = -1;
    },
    setActiveLessonleanred(lessonleanred, index) {
      this.currentLessonlearned = lessonleanred;
      this.currentIndex = lessonleanred ? index ?? -1 : -1;
    },
    async increaseProjectViews(item) {
      try {
        if (!item) return;
        const id = item.id;
        await LessonlearnedService.incrementViews(id);
        const baseIdx = this.lessonlearned_list.findIndex((v) => v.id === id);
        if (baseIdx !== -1) {
          const current = Number(this.lessonlearned_list[baseIdx].project_views ?? 0);
          this.lessonlearned_list[baseIdx].project_views = current + 1;
        }
        this.sendDataByItem(item);
      } catch (e) {
        console.error("조회수 증가 실패:", e);
      }
    },
    sendDataByItem(item) {
      try {
        this.setDatas = item ?? {};
        this.setFiles = [];
        if (this.setDatas.project_files) {
          this.setFiles = this.file_list.filter((f) => f.id === this.setDatas.id);
        }
      } catch (e) {
        console.error("sendDataByItem ERR>>", e);
      }
    },
    normalizeDate(v) {
      if (v == null) return null;
      if (v instanceof Date) return v;
      if (typeof v === "string" || typeof v === "number") return new Date(v);
      if (typeof (v == null ? void 0 : v.toDate) === "function") return v.toDate();
      if (typeof (v == null ? void 0 : v.seconds) === "number") return new Date(v.seconds * 1e3);
      if (v && typeof v === "object" && "$date" in v) return new Date(v.$date);
      const nested = (v == null ? void 0 : v.date) ?? (v == null ? void 0 : v.createdAt) ?? (v == null ? void 0 : v.created_at);
      if (nested) return this.normalizeDate(nested);
      return null;
    },
    format_date(get_date) {
      const d = this.normalizeDate(get_date);
      if (!d || isNaN(d)) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    },
    text_upper(value) {
      if (!value) return "";
      return String(value).toUpperCase();
    },
    writeLesson() {
      window.location.href = "/lesson/write";
    }
  },
  mounted() {
    this.retrieveLessonLearned();
  }
};
const { createElementVNode: _createElementVNode, vModelText: _vModelText, withDirectives: _withDirectives, openBlock: _openBlock, createElementBlock: _createElementBlock, withModifiers: _withModifiers, renderList: _renderList, Fragment: _Fragment, toDisplayString: _toDisplayString, createCommentVNode: _createCommentVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, createVNode: _createVNode } = await importShared("vue");
const _hoisted_1 = { class: "container-fluid" };
const _hoisted_2 = { class: "container-fluid content-box-rims" };
const _hoisted_3 = { class: "d-flex align-items-center mb-3" };
const _hoisted_4 = { class: "d-flex ms-3" };
const _hoisted_5 = { class: "container-fluid" };
const _hoisted_6 = { class: "row gx-5" };
const _hoisted_7 = { class: "col-md-4 p-3 border bg-light rounded-left-10" };
const _hoisted_8 = {
  class: "bd-subnavbar",
  style: { "height": "230px" }
};
const _hoisted_9 = { class: "input-group shadow-sm" };
const _hoisted_10 = { class: "bd-subnavbar" };
const _hoisted_11 = { class: "row gap-3 mb-3 p-3 bg-white border rounded keyword mx-auto shadow-sm" };
const _hoisted_12 = ["data-value"];
const _hoisted_13 = { class: "col-md-8 p-3 border bg-light" };
const _hoisted_14 = { class: "row row-padding" };
const _hoisted_15 = { class: "col-1 dropdown" };
const _hoisted_16 = {
  class: "btn dropdown-toggle fs-6",
  type: "button",
  "data-bs-toggle": "dropdown",
  "aria-expanded": "false"
};
const _hoisted_17 = { class: "dropdown-menu fs-6" };
const _hoisted_18 = {
  key: 0,
  class: "d-flex justify-content-center load_middle"
};
const _hoisted_19 = {
  key: 1,
  class: "d-flex justify-content-center load_middle"
};
const _hoisted_20 = {
  key: 2,
  class: "list-group"
};
const _hoisted_21 = ["onClick"];
const _hoisted_22 = {
  key: 0,
  class: "mb-1 text-primary fw-bold h5 long-text"
};
const _hoisted_23 = {
  key: 1,
  class: "mb-1 text-primary fw-bold h5 long-text"
};
const _hoisted_24 = { class: "mb-1 long-text" };
const _hoisted_25 = { class: "col-md-2 align-self-center text-left long-text" };
const _hoisted_26 = { class: "col-md-2 align-self-center text-left" };
const _hoisted_27 = { class: "big-small" };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_ShowLessonlearned = _resolveComponent("ShowLessonlearned");
  return _openBlock(), _createElementBlock("div", _hoisted_1, [
    _createElementVNode("div", _hoisted_2, [
      _createElementVNode("div", _hoisted_3, [
        _cache[8] || (_cache[8] = _createElementVNode("div", { class: "d-flex fs-5" }, "시운전 지식 검색", -1)),
        _createElementVNode("div", _hoisted_4, [
          _createElementVNode("button", {
            type: "button",
            class: "btn rims-custom-btn rounded-3 px-3 ms-2",
            onClick: _cache[0] || (_cache[0] = (...args) => $options.writeLesson && $options.writeLesson(...args))
          }, "지식공유+")
        ])
      ]),
      _createElementVNode("div", _hoisted_5, [
        _createElementVNode("div", _hoisted_6, [
          _createElementVNode("div", _hoisted_7, [
            _createElementVNode("div", _hoisted_8, [
              _cache[10] || (_cache[10] = _createElementVNode("div", { class: "fs-6 fw-bold text-primary d-flex" }, [
                _createElementVNode("div", { class: "d-flex" }, "시운전 Lesson Learned 검색")
              ], -1)),
              _createElementVNode("form", {
                class: "bd-search position-relative me-auto mt-3",
                onSubmit: _cache[3] || (_cache[3] = _withModifiers((...args) => $options.handleSubmit && $options.handleSubmit(...args), ["prevent"]))
              }, [
                _createElementVNode("div", _hoisted_9, [
                  _withDirectives(_createElementVNode("input", {
                    class: "form-control",
                    type: "text",
                    placeholder: "시운전 검색어를 입력하세요.",
                    "aria-label": "시운전 검색어를 입력하세요.",
                    "aria-describedby": "btnNavbarSearch",
                    spellcheck: "false",
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.search_issue = $event)
                  }, null, 512), [
                    [_vModelText, $data.search_issue]
                  ]),
                  _createElementVNode("button", {
                    class: "btn btn-primary",
                    id: "btnNavbarSearch",
                    type: "button",
                    onClick: _cache[2] || (_cache[2] = (...args) => $options.searchLessonlearned && $options.searchLessonlearned(...args))
                  }, _cache[9] || (_cache[9] = [
                    _createElementVNode("svg", {
                      xmlns: "http://www.w3.org/2000/svg",
                      width: "20",
                      height: "20",
                      fill: "currentColor",
                      class: "bi bi-search",
                      viewBox: "0 0 16 16"
                    }, [
                      _createElementVNode("path", { d: "M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" })
                    ], -1)
                  ]))
                ])
              ], 32)
            ]),
            _createElementVNode("div", _hoisted_10, [
              _cache[11] || (_cache[11] = _createElementVNode("div", { class: "fs-6 fw-bold text-primary" }, "시운전 Lesson Learend 키워드", -1)),
              _createElementVNode("div", _hoisted_11, [
                (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($data.keywords, (keyword) => {
                  return _openBlock(), _createElementBlock("button", {
                    type: "button",
                    class: "btn btn-primary col-md-auto",
                    key: keyword,
                    onClick: _cache[4] || (_cache[4] = (...args) => $options.keyword_select && $options.keyword_select(...args)),
                    "data-value": keyword
                  }, _toDisplayString(keyword), 9, _hoisted_12);
                }), 128))
              ])
            ])
          ]),
          _createElementVNode("div", _hoisted_13, [
            _createElementVNode("div", _hoisted_14, [
              _cache[12] || (_cache[12] = _createElementVNode("div", { class: "col-11 fs-6 fw-bold text-primary" }, "Lesson Learned 리스트", -1)),
              _createElementVNode("div", _hoisted_15, [
                _createElementVNode("button", _hoisted_16, _toDisplayString($data.sortOption), 1),
                _createElementVNode("ul", _hoisted_17, [
                  _createElementVNode("li", null, [
                    _createElementVNode("button", {
                      class: "dropdown-item",
                      type: "button",
                      onClick: _cache[5] || (_cache[5] = ($event) => $options.updateSortOption("최신순"))
                    }, "최신순")
                  ]),
                  _createElementVNode("li", null, [
                    _createElementVNode("button", {
                      class: "dropdown-item",
                      type: "button",
                      onClick: _cache[6] || (_cache[6] = ($event) => $options.updateSortOption("등록순"))
                    }, "등록순")
                  ]),
                  _createElementVNode("li", null, [
                    _createElementVNode("button", {
                      class: "dropdown-item",
                      type: "button",
                      onClick: _cache[7] || (_cache[7] = ($event) => $options.updateSortOption("조회순"))
                    }, "조회순")
                  ])
                ])
              ])
            ]),
            $data.loading ? (_openBlock(), _createElementBlock("div", _hoisted_18, _cache[13] || (_cache[13] = [
              _createElementVNode("div", {
                class: "spinner-border text-primary m-5",
                role: "status"
              }, [
                _createElementVNode("span", { class: "sr-only" })
              ], -1)
            ]))) : $data.select_empty ? (_openBlock(), _createElementBlock("div", _hoisted_19, _cache[14] || (_cache[14] = [
              _createElementVNode("img", {
                src: _imports_0,
                alt: "No data found"
              }, null, -1)
            ]))) : (_openBlock(), _createElementBlock("div", _hoisted_20, [
              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList($options.sortedLessonlearnedList, (item, index) => {
                return _openBlock(), _createElementBlock("div", {
                  class: "px-4 list-group-item list-group-item-action d-flex flex-row shadow-sm",
                  key: item.id ?? index
                }, [
                  _createElementVNode("div", {
                    class: "col-md-8 align-self-center",
                    "data-bs-toggle": "modal",
                    "data-bs-target": "#list_modal",
                    onClick: ($event) => $options.increaseProjectViews(item)
                  }, [
                    item.project_files ? (_openBlock(), _createElementBlock("div", _hoisted_22, [
                      _createTextVNode(_toDisplayString(item.project_title) + " ", 1),
                      _cache[15] || (_cache[15] = _createElementVNode("svg", {
                        height: "18",
                        width: "18",
                        version: "1.1",
                        id: "_x32_",
                        xmlns: "http://www.w3.org/2000/svg",
                        "xmlns:xlink": "http://www.w3.org/1999/xlink",
                        viewBox: "0 0 512 512",
                        "xml:space": "preserve",
                        fill: "#000000"
                      }, [
                        _createElementVNode("path", {
                          class: "st0",
                          d: "M454.821,253.582L273.256,435.14c-11.697,11.697-25.124,20.411-39.484,26.235 c-21.529,8.729-45.165,10.928-67.755,6.55c-22.597-4.378-44.054-15.25-61.597-32.784c-11.69-11.69-20.396-25.118-26.227-39.484 c-8.729-21.529-10.929-45.165-6.55-67.748c4.386-22.597,15.25-44.055,32.778-61.596l203.13-203.13 c7.141-7.134,15.299-12.43,24.035-15.969c13.1-5.318,27.516-6.656,41.263-3.994c13.769,2.677,26.798,9.27,37.498,19.963 c7.133,7.134,12.423,15.292,15.968,24.035c5.318,13.092,6.657,27.502,3.987,41.264c-2.67,13.762-9.262,26.783-19.955,37.498 L213.261,363.064c-2.534,2.528-5.375,4.364-8.436,5.61c-4.571,1.851-9.661,2.335-14.495,1.396 c-4.848-0.954-9.355-3.225-13.15-7.006c-2.534-2.534-4.364-5.368-5.603-8.429c-1.865-4.571-2.342-9.668-1.402-14.495 c0.947-4.841,3.225-9.355,7.005-13.149l175.521-175.528l-29.616-29.617l-175.528,175.52c-6.536,6.536-11.505,14.182-14.801,22.313 c-4.941,12.195-6.166,25.473-3.702,38.202c2.449,12.73,8.686,24.989,18.503,34.799c6.543,6.55,14.182,11.519,22.305,14.809 c12.202,4.948,25.473,6.165,38.21,3.702c12.722-2.449,24.989-8.678,34.806-18.511L439.97,195.602 c11.142-11.149,19.571-24.113,25.167-37.917c8.394-20.717,10.48-43.314,6.294-64.971c-4.179-21.643-14.73-42.432-31.46-59.155 c-11.149-11.142-24.114-19.571-37.918-25.166c-20.717-8.401-43.314-10.48-64.971-6.301c-21.643,4.186-42.431,14.737-59.155,31.468 L74.803,236.695c-15.713,15.691-27.552,33.931-35.426,53.352c-11.817,29.154-14.765,60.97-8.863,91.462 c5.888,30.478,20.717,59.696,44.29,83.254c15.698,15.713,33.931,27.552,53.36,35.426c29.146,11.811,60.97,14.758,91.455,8.863 c30.478-5.895,59.696-20.717,83.254-44.29l181.566-181.564L454.821,253.582z"
                        })
                      ], -1))
                    ])) : (_openBlock(), _createElementBlock("div", _hoisted_23, _toDisplayString(item.project_title), 1)),
                    _createElementVNode("div", _hoisted_24, _toDisplayString(item.project_issue), 1)
                  ], 8, _hoisted_21),
                  _createElementVNode("small", _hoisted_25, _toDisplayString(item.project_commander) + " | " + _toDisplayString($options.text_upper(item.project_part)), 1),
                  _createElementVNode("div", _hoisted_26, [
                    _createElementVNode("small", null, "작성일 " + _toDisplayString($options.format_date(item.project_date)), 1),
                    _cache[16] || (_cache[16] = _createElementVNode("br", null, null, -1)),
                    _createElementVNode("small", _hoisted_27, "조회수 " + _toDisplayString(item.project_views), 1)
                  ])
                ]);
              }), 128))
            ])),
            _createVNode(_component_ShowLessonlearned, {
              setData: $data.setDatas,
              setFile: $data.setFiles
            }, null, 8, ["setData", "setFile"])
          ])
        ])
      ])
    ])
  ]);
}
const LessonLearnedboard = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a006f980"]]);
export {
  LessonLearnedboard as default
};
