# Electronでつぶやきを保存する22

　検索とAutoPagerをリファクタリングした。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220927125452

## インストール＆実行

```sh
NAME='Electron.MyLog.20220927125452'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

## 動作確認

* 検索ボックスに`３`を入力すると23件取得できる（20件以上の場合。AutoPagerで2回取得する）
* 検索ボックスの`３`を消すと全件取得する（58件（AutoPagerで3回取得する））
* 検索ボックスに`４`を入力すると6件取得する（20件未満かつスクロール非表示）
* 検索ボックスに`２`を入力すると14件取得できる（20件未満かつスクロール表示）
* 検索ボックスに`ｘ`を入力すると0件取得する（0件の場合）

　それぞれ想定どおりに表示されたことを確認した。

# やったこと

## auto-pager.js

　HTML要素のイベント処理を実装する。そこで検索やAutoPager処理を呼び出す。コメントアウトは前回から削除した部分。

```javascript
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
        const isChange = await this.pager.select(keyword)
        this.pager.next(keyword).then(async(records)=>{
            if (isChange) { this.scrollEl.innerHTML = ''; }
            this.#toHtml(records)
        })
    }
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
```

要素|イベント|
----|--------|
検索ボックス|`input`|テキストを入力するたび検索して結果を一覧に表示する
つぶやき一覧|`scroll`|スクロール最下端に達するたび続きを表示する

　全件／検索でそれぞれ異なるSQLを発行する。そのAPI呼び分けを後述する`pager-manager.js`にまかせることにした。ここが今回の要点。

　そのほかにも`input`イベント時にタイムアウトしてなるだけSQL発行を抑えようとしている。また、結果のHTML表示はSQLが完了したあと非同期に行うようにした。なるだけフリーズせず、一覧が白飛びする時間を短くした。

## pager-manager.js

　全件／検索それぞれ用のページング処理をルーティングする。

```javascript
class PagerManager {
    constructor() {
        this._allPager = new Pager()
        this._searchPager = new SearchPager()
        this._lastPager = this._allPager
    }
    async init(keyword) {
        await Promise.all([this._allPager.init(), this._searchPager.init(keyword)])
    }
    async select(keyword) {
        const nowPager = (keyword) ? this._searchPager : this._allPager
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
        console.log(`PageManager.next()`, this._lastPager)
        await this._lastPager.next(keyword)
        return await this._lastPager.getPage(keyword)
    }
}
```

### 多態性

　よく考えたら検索テキストがあるかないかで分岐できることに気づいた。前回のように名前テキストを使って分岐する必要なんてなかった。

　多態性を実現した。全件／検索でそれぞれ呼び出すAPIが異なる。しかも引数なしと引数ありという違いまである。でもそこを同じメソッド呼出だけで実現したい。それをしたのが`this._lastPager.getPage(keyword)`のところ。`_lastPager`が状況によって変わるインスタンス。

状況|使うクラス
----|----------
全件|`Pager`
検索|`SearchPager`

　`getPage(keyword)`はSQLを発行した結果を返す。引数`keyword`を渡していることから検索時のときのようにみえる。でもじつは全件のときもこれでOK。全件のときは引数なしなので無視されるだけ。

### 課題

　全件／検索が切り替わるとき、一覧をクリアしないといけない。そこで`select()`で真偽値をかえすことにした。切り替わったときは真を返す。あとは呼び出し元の`if`文で一覧クリアさせる。

　これは必要な処理だが、このクラスに持たせたくない。UIは別のクラスにしたい。でもそれをすると超大変そう。最終的にはフレームワークを使うことになるか。現状でははるか先の話。私のスキルが追いつかない。

　具体的にはGUIのListクラスみたいなものを想定している。SQLで取得したデータを渡せば、あとはよろしくやってくれるイメージ。イベント駆動でなくモデル駆動。たぶんそういうUIフレームワークがあるんじゃないかと勝手に思ってる。でも自分で作り込まないとダメかな？

## pager.js

　全件取得するときのページング計算とSQL呼出。

```javascript
class Pager {
    constructor() {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = -1
    }
    async init() {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = await this.getCount()
    }
    async next() {
        if (this._offset < this._count) {
            this._page++;
            this._offset = this._limit * this._page
            return true
        } else { return false }
    }
    async getPage() { return await window.myApi.getPage(this._limit, this._offset) }
    async getCount() { return await window.myApi.count() }
}
```

　本当はコンストラクタで`count`を初期化したかった。でもコンストラクタでは`async`/`await`できない。仕方なく`init()`でやることにした。

## search-pager.js

　検索したつぶやきを取得するときのページング計算とSQL呼出。

```javascript
class SearchPager extends Pager {
    async init(keyword) {
        this._limit = 20
        this._page = -1
        this._offset = this._limit * this._page
        this._count = await this.getCount(keyword)
    }
    async getPage(keyword) { return await window.myApi.searchPage(keyword, this._limit, this._offset) }
    async getCount(keyword) { return await window.myApi.searchCount(keyword) }
}
```

　全件のときのそれを継承している。ちがいは検索キーワードを引数で受け取るところ。それを検索用SQL呼出APIに渡している。

　継承したから`getPage()`などのメソッドも持っているはず。でもたぶん`getPage(keyword)`を定義したから上書きされたか何かで、こちらのほうが呼び出されるようになるっぽい。

　親は引数なし、子は引数あり。ならメソッドシグネチャが異なるのでは？　別メソッドとしてそれぞれ持っている状態なのでは？　と思っていたのだが、それはC#など他の言語でオーバーロードまたは同名・同引数メソッドを`override`でなく`new`したときの話。JSでは同名メソッドは同じシグネチャになるのか？　よくわからないが後に定義されたものが呼び出されるっぽい。

# 多態性

　多態性を実現できた。ポイントはメソッド名を同じにすること。

　`Pager`と`SearchPager`という別クラスのインスタンスを状況によって変更する。それぞれ同じメソッド`init`, `getPage`, `getCount`をもっている。メソッド名を同じにしておけば呼出元でおなじコードひとつで呼び出せる。`if`や`switch`文で呼び分けせずに済む。

　前回は以下のように呼び分けていた。

```javascript
switch (this.mode) {
    case 'all': return await this.pager[this.mode].getPage(keyword)
    case 'search': return await this.pager[this.mode].getSearchPage(keyword)
    default: throw new Error(`this.modeは all か search にしてください。`)
}
```

　今回は以下のように単一メソッドで書けた。

```javascript
return await this._lastPager.getPage(keyword)
```

　多態性するメソッドは`Pager`:引数なし、`SearchPager`:引数ありという違いがある。でも問題ない。常に引数を渡しておけばいい。もし引数なしメソッドに引数を渡してもエラーにはならず無視されるだけ。もし引数ありメソッドなら常に渡されるので問題なし。

# 所感

　前回よりは少しマシなコードになったはず。でもまだ汚い。

　オーバーロード、多態性、オプション引数。どれも使わずに書けた。あれだけギャーギャー騒いでいたのに。自分がどれだけプログラミング言語を理解できていないか少しだけわかった。

# 検索の課題

- [x] バグ修正。スクロールを最下端にやると全件取得の最新から20件を取得してしまう（検索キーワードと関係なく）
- [x] ページング実装。（最新順20件ずつ。`LIMIT`句、`OFFSET`句）
    - [ ] 大文字と小文字を区別したい（`LIKE`句では区別しない仕様）
    - [ ] メタ文字をエスケープしたい（`%`, `_`がメタ文字。`like '%10$%' escape '$'`）
- [x] リファクタリング
    - [x] 全件／検索のAPIルーティング
    - [ ] UIを別クラスに分離する
- [ ] 取得件数を表示したい
- [ ] FTS(Full Text Search)を使うべき
    - [ ] 大文字・小文字を区別せずヒットさせ、一致率に影響させたい
    - [ ] `AND`, `OR`検索したい
        - [ ] キーワードをスペース区切りにしたら各語ごとに`AND`をかけたい（現状はスペースもキーワードの一部になってしまう）
        - [ ] 表記ゆれに該当するものを`OR`検索したい
    - [ ] 一致率に応じて優先順位を算出したい
- [ ] UIショートカットキーを設定したい
    - [ ] スクロールバーにフォーカスする
    - [ ] 検索ボックスにフォーカスする
- [ ] 出力サイト側でも検索したい

　消化するより増えるほうが速いような……。

