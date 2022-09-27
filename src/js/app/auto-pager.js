class AutoPager {
    constructor(setting, scrollElQuery, searchElQuery) {
        console.log(setting, scrollElQuery, searchElQuery)
        /*
        this.MODES = ['all', 'search']
        this.mode = 'all' // 'all' or 'search'
        this.pager = {
            'all': new AutoPagerCalc(),
            'search': new AutoPagerCalcSearch(searchElQuery),
        }
        */
        this.pager = new PagerManager()
        this.setting = setting
        //this.scrollEl = document.querySelector('#post-list')
        this.scrollEl = document.querySelector(scrollElQuery)
        this.searchEl = document.querySelector(searchElQuery)
        this.scrollTimeoutId = 0
        this.inputTimeoutId = 0
        //console.log('AutoPager.count:', this.count, this.offset)
    }
    /*
    async changeMode(mode) {
        console.log('AutoPager.changeMode():', mode)
        if (mode === this.mode) { return }
        this.mode = mode
        console.log('AutoPager.changeMode():', 'this.clear()')
        await this.clear()
        this.scrollEl.innerHTML = ''
    }
    */
    //async setup(scrollElId, searchElId, mode='all') {
    async setup() {
        console.log('AutoPager.setup()')
        this.mode = 'all'
        await this.pager.init()
        //await this.pager.clear()
        //await this.clear()
        //this.count = await window.myApi.count()
        this.scrollEl.addEventListener('scroll', async(event) => {
            clearTimeout(this.scrollTimeoutId);
            this.scrollTimeoutId = setTimeout(async()=>{
                if (this.#isFullScrolled(event)) {
                    console.log('scroll event!!:', this.mode)
                    //this.#toHtml(await this.#next())
                    //await this.next()
                    this.next(this.searchEl.value)
                }
            }, 200);
        })
        this.searchEl.addEventListener('input', async(e)=>{
            clearTimeout(this.inputTimeoutId);
            this.inputTimeoutId = setTimeout(async()=>{
                this.scrollEl.innerHTML = ''
                //await this.changeMode((0 < e.target.value.length) ? 'search' : 'all')
                await this.pager._searchPager.init(e.target.value)
                await this.next(e.target.value, true)
            }, 200);
        })
        this.next(this.searchEl.value)
        //this.next()
        //this.#toHtml(await this.#next())
    }
    //async next() { this.#toHtml(await this.#next()) }
    //async next(keyword) { this.#toHtml(await this.#next(keyword)) }
    async next(keyword) {
        /*
        const isChange = await this.pager.select(keyword)
        if (isChange) { console.log('一覧クリア！！！！！！！！！！'); this.scrollEl.innerHTML = ''; }
        //this.#toHtml(await this.pager.next(keyword))
        this.pager.next(keyword).then(records=>this.#toHtml(records))
        */
        const isChange = await this.pager.select(keyword)
        this.pager.next(keyword).then(async(records)=>{
            if (isChange) { console.log('一覧クリア！！！！！！！！！！'); this.scrollEl.innerHTML = ''; }
            this.#toHtml(records)
        })
        /*
        this.pager.next(keyword).then(async(records)=>{
            const isChange = await this.pager.select(keyword)
            if (isChange) { console.log('一覧クリア！！！！！！！！！！'); this.scrollEl.innerHTML = ''; }
            this.#toHtml(records)
        })
        */
    }
    /*
    async next(keyword, isFlush=false) {
        if (isFlush) { this.scrollEl.innerHTML = '' }
        else {
            const isChange = await this.pager.select(keyword)
            if (isChange) { console.log('一覧クリア！！！！！！！！！！'); this.scrollEl.innerHTML = ''; }
        }
        this.#toHtml(await this.pager.next(keyword))
    }
    */
    /*
    async clear(mode=null) {
        if (mode) { await this.pager[mode].clear() }
        else { for await (var m of this.MODES) { await this.pager[m].clear() } }
    }
    */
    #isFullScrolled(event) {
        const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
        const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
        console.log(`isFullScrolled: ${positionWithAdjustmentValue >= event.target.scrollHeight}`)
        return positionWithAdjustmentValue >= event.target.scrollHeight
    }
    /*
    async #next(keyword) {
        await this.pager.next()
        return await this.pager.getPage(keyword)
    }
    */
    /*
    async #next(keyword) {
        console.log('AutoPager.next(): ', this.mode)
        const next = await this.pager[this.mode].next()
        console.log('next():', next, this.mode)
        switch (this.mode) {
            case 'all': return await this.pager[this.mode].getPage(keyword)
            case 'search': return await this.pager[this.mode].getSearchPage(keyword)
            default: throw new Error(`this.modeは all か search にしてください。`)
        }
    }
    */
    #toHtml(records) {
        console.log(records)
        if (records) {
            console.log(this.scrollEl)
            this.scrollEl.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
        }
    }
}
