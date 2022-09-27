class AutoPager {
    constructor(setting, scrollElQuery, searchElQuery) {
        console.log(setting, scrollElQuery, searchElQuery)
        this.MODES = ['all', 'search']
        this.mode = 'all' // 'all' or 'search'
        this.pager = {
            'all': new AutoPagerCalc(),
            'search': new AutoPagerCalcSearch(searchElQuery),
        }
        this.setting = setting
        //this.scrollEl = document.querySelector('#post-list')
        this.scrollEl = document.querySelector(scrollElQuery)
        this.searchEl = document.querySelector(searchElQuery)
        this.timeoutId = 0
        //console.log('AutoPager.count:', this.count, this.offset)
    }
    async changeMode(mode) {
        console.log('AutoPager.changeMode():', mode)
        if (mode === this.mode) { return }
        this.mode = mode
        console.log('AutoPager.changeMode():', 'this.clear()')
        await this.clear()
        this.scrollEl.innerHTML = ''
    }
    //async setup(scrollElId, searchElId, mode='all') {
    async setup() {
        console.log('AutoPager.setup()')
        this.mode = 'all'
        await this.clear()
        //this.count = await window.myApi.count()
        this.scrollEl.addEventListener('scroll', async(event) => {
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(async()=>{
                if (this.#isFullScrolled(event)) {
                    console.log('scroll event!!:', this.mode)
                    //this.#toHtml(await this.#next())
                    //await this.next()
                    this.next(this.searchEl.value)
                }
            }, 200);
        })
        this.searchEl.addEventListener('input', async(e)=>{
            await this.changeMode((0 < e.target.value.length) ? 'search' : 'all')
            await this.next(e.target.value)
        })
        this.next(this.searchEl.value)
        //this.next()
        //this.#toHtml(await this.#next())
    }
    //async next() { this.#toHtml(await this.#next()) }
    async next(keyword) { this.#toHtml(await this.#next(keyword)) }
    async clear(mode=null) {
        if (mode) { await this.pager[mode].clear() }
        else { for await (var m of this.MODES) { await this.pager[m].clear() } }
    }
    #isFullScrolled(event) {
        const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
        const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
        console.log(`isFullScrolled: ${positionWithAdjustmentValue >= event.target.scrollHeight}`)
        return positionWithAdjustmentValue >= event.target.scrollHeight
    }
    async #next(keyword) {
        console.log('AutoPager.next(): ', this.mode)
        const next = await this.pager[this.mode].next()
        console.log('next():', next, this.mode)
        switch (this.mode) {
            case 'all': return await this.pager[this.mode].getPage(keyword)
            case 'search': return await this.pager[this.mode].getSearchPage(keyword)
            default: throw new Error(`this.modeは all か search にしてください。`)
        }
        //return await this.pager[this.mode].getPage(keyword)
        /*
        if (next) {
            return await this.pager[this.mode].getPage(keyword)
        }
        */
        /*
        if (this.offset < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            console.log(this.limit, this.offset)
            return await this.pager[this.mode].next()
            //return await window.myApi.getPage(this.limit, this.offset)
        } else { return [] }
        */
    }
    #toHtml(records) {
        console.log(records)
        if (records) {
            this.scrollEl.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
        }
    }
}
