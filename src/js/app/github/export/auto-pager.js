class AutoPager {
    constructor(setting) {
        //this.loader = (loader) ? loader : new SqliteDbLoader()
        this.loader = new SqliteDbLoader()
        this.limit = 20
        this.page = -1
        this.offset = this.limit * this.page
        this.count = 0
        this.setting = setting
        this.ui = document.querySelector('#post-list')
        //this.ui = document.body
        this.timeoutId = 0
        console.log('AutoPager.count:', this.count, this.offset)
    }
    async setup() {
        await this.loader.load()
        console.log('AutoPager.setup()')
        //this.count = await window.myApi.count()
        this.count = await this.loader.DB.exec(`select count(*) from comments;`)[0].values[0][0]
        console.log('AutoPager.count:', this.count, this.offset)
        document.addEventListener('scroll', async(event) => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(async()=>{
                console.log(window.innerHeight, this.ui.innerHeight, document.body.scrollTop)
                //if ((document.body.clientHeight - window.innerHeight - 60) <= window.pageYOffset) {
                if (this.#isFullScrolled()) {
                    this.#toHtml(await this.#next())
                }
            }, 200);
        })
        /*
        this.ui.addEventListener('scroll', async(event) => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(async()=>{
                if (this.#isFullScrolled(event)) {
                    this.#toHtml(await this.#next())
                }
            }, 200);
        })
        */
        this.#toHtml(await this.#next())
    }
    #isFullScrolled() { return ((document.body.clientHeight - window.innerHeight - 60) <= window.pageYOffset) }
    /*
    #isFullScrolled(event) {
        const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
        const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
        console.log(`isFullScrolled: ${positionWithAdjustmentValue >= event.target.scrollHeight}`)
        return positionWithAdjustmentValue >= event.target.scrollHeight
    }
    */
    async #next() {
        console.log('AutoPager.next()')
        if (this.offset < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            console.log(this.limit, this.offset)
            return await this.loader.DB.exec(`select * from comments order by created desc limit ${this.limit} offset ${this.offset};`)[0].values
            //return await window.myApi.getPage(this.limit, this.offset)
        } else { return [] }
    }
    #toHtml(records) {
        console.log(records)
        this.ui.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
    }
}
