class Pager {
    constructor() {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = -1
    }
    /*
    get page() { return this._page }
    set page(v) {
        if (this._offset < this._count) {
            //this._page++;
            this._page = v;
            this._offset = this._limit * this._page
            console.log(`${this.constructor.name}.set page = ${v}, count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
        }
    }
    */
    async init() {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = await this.getCount()
        console.log(`${this.constructor.name}.clear(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
    }
    async next() {
        console.log(`${this.constructor.name}.next(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
        if (this._offset < this._count) {
            this._page++;
            this._offset = this._limit * this._page
            console.log(this._limit, this._offset)
            console.log(`ページ・インクリメント！！！！！！！！！！！！`)
            console.log(`${this.constructor.name}.next(), count:${this._count} page:${this._page} limit:${this._limit} offset:${this._offset}`)
            return true
        } else { return false }
        //this.page++;
    }
    async getPage() { return await window.myApi.getPage(this._limit, this._offset) }
    async getCount() { return await window.myApi.count() }
}
