class AutoPagerCalc {
    constructor() {
        /*
        this.limit = 20
        this.page = -1
        this.offset = this.limit * this.page
        this.count = 0
        */
        //this.clear()
    }
    async clear() {
        this.limit = 20
        this.page = -1
        this.offset = this.limit * this.page
        this.count = await this.getCount()
        console.log(`${this.constructor.name}.clear(), count:${this.count} page:${this.page} limit:${this.limit} offset:${this.offset}`)
    }
    async next() {
        //console.log('AutoPagerCalc.next()')
        console.log(`${this.constructor.name}.next(), count:${this.count} page:${this.page} limit:${this.limit} offset:${this.offset}`)
        //if (this.count <= this.limit) { return true }
        //if (this.offset < this.count && this.limit < this.count) {
        if (this.offset < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            console.log(this.limit, this.offset)
            //return await window.myApi.getPage(this.limit, this.offset)
            console.log(`!!! ${this.constructor.name}.next(), count:${this.count} page:${this.page} limit:${this.limit} offset:${this.offset}`)
            return true
        } else { return false }
    }
    //async getPage() { return (this.offset < this.count) ? await window.myApi.getPage(this.limit, this.offset) : [] }
    async getPage() { return await window.myApi.getPage(this.limit, this.offset) }
    async getCount() { return await window.myApi.count() }
    //async getPage(keyword) { return await window.myApi.searchPage(keyword, this.limit, this.offset) }
    //async getCount() { return await window.myApi.serchCount() }
    /*
    async setup() {
        console.log('AutoPager.setup()')
        this.mode = 'all'
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
    #toHtml(records) {
        console.log(records)
        this.ui.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
    }
    */
}
