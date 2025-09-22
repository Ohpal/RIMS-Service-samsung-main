<!-- Lesson Learned Page -->
<template>
  <div class="container-fluid">
    <!--Lesson Learned 검색-->
    <div class="container-fluid content-box-rims">
      <div class="d-flex align-items-center mb-3">
        <div class="d-flex fs-5">시운전 지식 검색</div>
        <div class="d-flex ms-3">
          <button type="button" class="btn rims-custom-btn rounded-3 px-3 ms-2" @click="writeLesson">지식공유+</button>
        </div>
      </div>
      <div class="container-fluid">
        <div class="row gx-5">
          <div class="col-md-4 p-3 border bg-light rounded-left-10">
            <div class="bd-subnavbar" style="height: 230px">
              <div class="fs-6 fw-bold text-primary d-flex">
                <div class="d-flex">시운전 Lesson Learned 검색</div>
              </div>
              <form class="bd-search position-relative me-auto mt-3" @submit.prevent="handleSubmit">
                <div class="input-group shadow-sm">
                  <input class="form-control" type="text" placeholder="시운전 검색어를 입력하세요." aria-label="시운전 검색어를 입력하세요." aria-describedby="btnNavbarSearch" spellcheck="false" v-model="search_issue" />
                  <button class="btn btn-primary" id="btnNavbarSearch" type="button" @click="searchLessonlearned">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

            <div class="bd-subnavbar">
              <div class="fs-6 fw-bold text-primary">시운전 Lesson Learend 키워드</div>
              <div class="row gap-3 mb-3 p-3 bg-white border rounded keyword mx-auto shadow-sm">
                <button type="button" class="btn btn-primary col-md-auto" v-for="keyword in keywords" :key="keyword" @click="keyword_select" :data-value="keyword">
                  {{ keyword }}
                </button>
              </div>
            </div>
          </div>

          <!--Lesson Learned 리스트-->
          <div class="col-md-8 p-3 border bg-light">
            <div class="row row-padding">
              <div class="col-11 fs-6 fw-bold text-primary">Lesson Learned 리스트</div>
              <div class="col-1 dropdown">
                <button class="btn dropdown-toggle fs-6" type="button" data-bs-toggle="dropdown" aria-expanded="false">{{ sortOption }}</button>
                <ul class="dropdown-menu fs-6">
                  <li><button class="dropdown-item" type="button" @click="updateSortOption('최신순')">최신순</button></li>
                  <li><button class="dropdown-item" type="button" @click="updateSortOption('등록순')">등록순</button></li>
                  <li><button class="dropdown-item" type="button" @click="updateSortOption('조회순')">조회순</button></li>
                </ul>
              </div>
            </div>

            <div class="d-flex justify-content-center load_middle" v-if="loading">
              <div class="spinner-border text-primary m-5" role="status"><span class="sr-only"></span></div>
            </div>

            <!-- 검색 데이터 없을때 이미지 -->
            <div class="d-flex justify-content-center load_middle" v-else-if="select_empty">
              <img src="../assets/image/notfound.png" alt="No data found" />
            </div>

            <div class="list-group" v-else>
              <div class="px-4 list-group-item list-group-item-action d-flex flex-row shadow-sm" v-for="(item, index) in sortedLessonlearnedList" :key="item.id ?? index">
                <div class="col-md-8 align-self-center" data-bs-toggle="modal" data-bs-target="#list_modal" @click="increaseProjectViews(item)">
                  <div class="mb-1 text-primary fw-bold h5 long-text" v-if="item.project_files">
                    {{ item.project_title }}
                    <svg height="18" width="18" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000">
                      <path class="st0" d="M454.821,253.582L273.256,435.14c-11.697,11.697-25.124,20.411-39.484,26.235 c-21.529,8.729-45.165,10.928-67.755,6.55c-22.597-4.378-44.054-15.25-61.597-32.784c-11.69-11.69-20.396-25.118-26.227-39.484 c-8.729-21.529-10.929-45.165-6.55-67.748c4.386-22.597,15.25-44.055,32.778-61.596l203.13-203.13 c7.141-7.134,15.299-12.43,24.035-15.969c13.1-5.318,27.516-6.656,41.263-3.994c13.769,2.677,26.798,9.27,37.498,19.963 c7.133,7.134,12.423,15.292,15.968,24.035c5.318,13.092,6.657,27.502,3.987,41.264c-2.67,13.762-9.262,26.783-19.955,37.498 L213.261,363.064c-2.534,2.528-5.375,4.364-8.436,5.61c-4.571,1.851-9.661,2.335-14.495,1.396 c-4.848-0.954-9.355-3.225-13.15-7.006c-2.534-2.534-4.364-5.368-5.603-8.429c-1.865-4.571-2.342-9.668-1.402-14.495 c0.947-4.841,3.225-9.355,7.005-13.149l175.521-175.528l-29.616-29.617l-175.528,175.52c-6.536,6.536-11.505,14.182-14.801,22.313 c-4.941,12.195-6.166,25.473-3.702,38.202c2.449,12.73,8.686,24.989,18.503,34.799c6.543,6.55,14.182,11.519,22.305,14.809 c12.202,4.948,25.473,6.165,38.21,3.702c12.722-2.449,24.989-8.678,34.806-18.511L439.97,195.602 c11.142-11.149,19.571-24.113,25.167-37.917c8.394-20.717,10.48-43.314,6.294-64.971c-4.179-21.643-14.73-42.432-31.46-59.155 c-11.149-11.142-24.114-19.571-37.918-25.166c-20.717-8.401-43.314-10.48-64.971-6.301c-21.643,4.186-42.431,14.737-59.155,31.468 L74.803,236.695c-15.713,15.691-27.552,33.931-35.426,53.352c-11.817,29.154-14.765,60.97-8.863,91.462 c5.888,30.478,20.717,59.696,44.29,83.254c15.698,15.713,33.931,27.552,53.36,35.426c29.146,11.811,60.97,14.758,91.455,8.863 c30.478-5.895,59.696-20.717,83.254-44.29l181.566-181.564L454.821,253.582z" />
                    </svg>
                  </div>
                  <div class="mb-1 text-primary fw-bold h5 long-text" v-else>{{ item.project_title }}</div>
                  <div class="mb-1 long-text">{{ item.project_issue }}</div>
                </div>

                <small class="col-md-2 align-self-center text-left long-text">{{ item.project_commander }} | {{ text_upper(item.project_part) }}</small>

                <div class="col-md-2 align-self-center text-left">
                  <small>작성일 {{ format_date(item.project_date) }}</small
                  ><br />
                  <small class="big-small">조회수&nbsp;{{ item.project_views }}</small>
                </div>
              </div>
            </div>

            <!-- Lessonlearned 상세보기 Modal -->
            <ShowLessonlearned :setData="setDatas" :setFile="setFiles" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import WriteLessonlearned from './WriteLessonlearned.vue'
import LessonlearnedService from '../services/LessonlearnedService'
import ShowLessonlearned from './ShowLessonlearned.vue'

export default {
  components: { WriteLessonlearned, ShowLessonlearned },
  name: 'LessonLearned',
  data() {
    return {
      currentLessonlearned: null,
      message: '',
      lessonlearned_list: [],
      file_list: [],
      currentIndex: -1,
      setDatas: {}, // ← 객체로 초기화
      setFiles: [],
      keywords: ['#전 체', '#안 벽', '#기 관', '#선 장', '#전 장', '#해 상', '#GENERAL', '#HULL', '#MACHINERY', '#ELECTRIC', '#ACCOMMODATION', '#OUTFITTING'],
      search_issue: '',
      loading: true,
      load_error: null,
      select_empty: false,
      sortOption: '최신순',
    }
  },
  computed: {
    sortedLessonlearnedList() {
      const list = [...this.lessonlearned_list]
      if (this.sortOption === '조회순') {
        return list.sort((a, b) => Number(b.project_views ?? 0) - Number(a.project_views ?? 0))
      } else if (this.sortOption === '최신순') {
        return list.sort((a, b) => new Date(b.project_date) - new Date(a.project_date))
      } else if (this.sortOption === '등록순') {
        return list.sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
      }
      return list // 기본 반환
    },
  },

  methods: {
    // 전체 Select (동시 호출 후 로딩 종료)
    async retrieveLessonLearned() {
      try {
        this.loading = true
        this.load_error = null
        this.select_empty = false

        const [listRes, fileRes] = await Promise.all([LessonlearnedService.selectAll(), LessonlearnedService.selectFile()])

        this.lessonlearned_list = listRes?.data ?? []
        this.file_list = fileRes?.data ?? []
      } catch (e) {
        this.load_error = '게시물을 불러오는 중 오류가 발생하였습니다.'
        console.log('retrieveLessonLearned>>', e)
      } finally {
        this.loading = false
      }
    },

    // 검색 List 정렬 옵션 업데이트
    updateSortOption(option) {
      this.sortOption = option
    },

    /*--------------------------------------------------------*/
    // 검색 Select
    async searchLessonlearned() {
      this.loading = true
      this.load_error = null
      this.select_empty = false

      const q = (this.search_issue ?? '').trim()
      if (!q) {
        this.loading = false
        alert('시운전 검색어를 입력하세요.')
        return
      }

      try {
        const response = await LessonlearnedService.selectELK(q)
        this.lessonlearned_list = response.data ?? []
        this.setActiveLessonleanred(null)
        this.select_empty = this.lessonlearned_list.length === 0
      } catch (e) {
        this.load_error = '게시물을 불러오는 중 오류가 발생하였습니다.'
        console.log('searchLessonlearned ERR>>', e)
      } finally {
        this.loading = false
      }
    },

    // 카테고리 Select
    async keyword_select(event) {
      try {
        this.loading = true
        this.load_error = null
        this.select_empty = false

        let btn_text = event.target.textContent || ''
        btn_text = btn_text.replace('#', '').replace(/\s+/g, '')

        if (btn_text === '전체') {
          await this.retrieveLessonLearned()
        } else {
          const response = await LessonlearnedService.selectELK(btn_text)
          this.lessonlearned_list = response.data ?? []
          this.setActiveLessonleanred(null)
          this.select_empty = this.lessonlearned_list.length === 0
        }
      } catch (e) {
        this.load_error = '게시물을 불러오는 중 오류가 발생하였습니다.'
        console.log('keyword_select>>', e)
      } finally {
        this.loading = false
      }
    },

    // 엔터키를 통한 검색
    async handleSubmit() {
      this.searchLessonlearned()
    },

    // 리스트 화면 갱신
    refreshList() {
      this.retrieveLessonLearned()
      this.currentLessonlearned = null
      this.currentIndex = -1
    },

    setActiveLessonleanred(lessonleanred, index) {
      this.currentLessonlearned = lessonleanred
      this.currentIndex = lessonleanred ? (index ?? -1) : -1
    },

    async increaseProjectViews(item) {
      try {
        if (!item) return
        const id = item.id

        // 서버 조회수 증가
        await LessonlearnedService.incrementViews(id)

        // 원본 배열에서 해당 글 찾아서 조회수 증가
        const baseIdx = this.lessonlearned_list.findIndex((v) => v.id === id)
        if (baseIdx !== -1) {
          const current = Number(this.lessonlearned_list[baseIdx].project_views ?? 0)
          this.lessonlearned_list[baseIdx].project_views = current + 1
        }

        // 모달에 전달할 데이터 설정도 item/id 기준으로
        this.sendDataByItem(item)
      } catch (e) {
        console.error('조회수 증가 실패:', e)
      }
    },

    sendDataByItem(item) {
      try {
        this.setDatas = item ?? {}
        this.setFiles = []
        if (this.setDatas.project_files) {
          // 파일 매칭 키가 정말 id인지 확인 필요. (보통 post_id 형태)
          this.setFiles = this.file_list.filter((f) => f.id === this.setDatas.id)
        }
      } catch (e) {
        console.error('sendDataByItem ERR>>', e)
      }
    },

    normalizeDate(v) {
      if (v == null) return null
      if (v instanceof Date) return v
      if (typeof v === 'string' || typeof v === 'number') return new Date(v)

      // Firestore Timestamp
      if (typeof v?.toDate === 'function') return v.toDate()

      // Firestore { seconds, nanoseconds }
      if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000)

      // MongoDB { $date: ... }
      if (v && typeof v === 'object' && '$date' in v) return new Date(v.$date)

      // 기타 래퍼 { date: ... } / { createdAt: ... }
      const nested = v?.date ?? v?.createdAt ?? v?.created_at
      if (nested) return this.normalizeDate(nested)

      return null
    },

    format_date(get_date) {
      const d = this.normalizeDate(get_date)
      if (!d || isNaN(d)) return ''
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },

    text_upper(value) {
      if (!value) return ''
      return String(value).toUpperCase()
    },

    writeLesson() {
      window.location.href = '/lesson/write'
    },
  },

  mounted() {
    this.retrieveLessonLearned()
  },
}
</script>

<style scoped src="../assets/css/LessonLearned.css"></style>
<style scoped src="../assets/css/loading.css"></style>
