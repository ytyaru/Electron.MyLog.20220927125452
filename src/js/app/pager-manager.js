class PagerManager {
    constructor() {
        this._allPager = new Pager()
        this._searchPager = new SearchPager()
        this._lastPager = this._allPager
    }
    async init(keyword) {
        await Promise.all([this._allPager.init(), this._searchPager.init(keyword)])
        //await this._allPager.init()
        //await this._searchPager.init()
    }
    async select(keyword) {
        const nowPager = (keyword) ? this._searchPager : this._allPager
        //const nowPager = await ((keyword) ? this._searchPager : this._allPager).next(keyword)
        console.log(`PagerManager.select(${keyword})`, nowPager, this._lastPager)
        if (this._lastPager !== nowPager) {
            console.log(`モードが変わりました！　初期化します。全件／検索: ${nowPager.constructor.name}`)
            await this.init(keyword)
            this._lastPager = nowPager
            return true
        } else {
            this._lastPager = nowPager
            return false
        }
    }
    async next(keyword) {
        /*
        const nowPager = (keyword) ? this._searchPager : this._allPager
        //const nowPager = await ((keyword) ? this._searchPager : this._allPager).next(keyword)
        if (this._lastPager !== nowPager) {
            console.log(`モードが変わりました！　初期化します。全件／検索: ${nowPager.constructor.name}`)
            this.init(keyword)
            this._lastPager = nowPager
        }
        */
        console.log(`PageManager.next()`, this._lastPager)
        await this._lastPager.next(keyword)
        return await this._lastPager.getPage(keyword)
    }
}
