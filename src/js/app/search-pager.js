class SearchPager extends Pager {
    /*
    constructor() {}
    get page() { returh this._page }
    set page(v) {
        if (this._offset < this._count) {
            this._page++;
            this._offset = this._limit * this._page
        }
    }
    */
    async init(keyword) {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = await this.getCount(keyword)
        console.log(`${this.constructor.name}.clear(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
    }
    /*
    async next(keyword) {
        this._count = await this.getCount(keyword)
        super.next()
    }
    */
    async getPage(keyword) { return await window.myApi.searchPage(keyword, this._limit, this._offset) }
    async getCount(keyword) { return await window.myApi.searchCount(keyword) }
    /*
    async next() {
        console.log(`${this.constructor.name}.next(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
        if (this._offset < this._count) {
            this._page++;
            this._offset = this._limit * this._page
            console.log(this._limit, this._offset)
            console.log(`!!! ${this.constructor.name}.next(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
            return true
        } else { return false }
    }
    */
}
