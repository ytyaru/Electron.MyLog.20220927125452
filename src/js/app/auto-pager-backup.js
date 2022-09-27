class AutoPager {
    constructor(setting) {
        this.limit = 20
        this.page = -1
        this.offset = this.limit * this.page
        this.count = 0
        this.setting = setting
        this.ui = document.querySelector('#post-list')
        this.timeoutId = 0
        console.log('AutoPager.count:', this.count, this.offset)
    }
    async setup() {
        console.log('AutoPager.setup()')
        this.count = await window.myApi.count()
        this.ui.addEventListener('scroll', async(event) => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(async()=>{
                if (this.#isFullScrolled(event)) {
                    this.#toHtml(await this.#next())
                }
            }, 200);
        })
        this.#toHtml(await this.#next())
    }
    #isFullScrolled(event) {
        const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
        const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
        console.log(`isFullScrolled: ${positionWithAdjustmentValue >= event.target.scrollHeight}`)
        return positionWithAdjustmentValue >= event.target.scrollHeight
    }
    async #next() {
        console.log('AutoPager.next()')
        if (this.offset < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            console.log(this.limit, this.offset)
            return await window.myApi.getPage(this.limit, this.offset)
        } else { return [] }
    }
    #toHtml(records) {
        console.log(records)
        this.ui.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
    }
}
