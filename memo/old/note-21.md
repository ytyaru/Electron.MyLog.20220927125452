# Electronでつぶやきを保存する21

　検索したときもAutoPagerが機能するようにした。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/

## インストール＆実行

```sh
NAME=''
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

## 動作確認

* 検索ボックスに`３`を入力すると23件取得できる（20件以上の場合）
* 検索ボックスの`３`を消すと全件取得する（58件（AutoPagerで3回取得する））
* 検索ボックスに`４`を入力すると6件取得する（20件未満の場合）
* 検索ボックスに`ｘ`を入力すると0件取得する（0件の場合）

　それぞれ想定どおりに表示されたことを確認した。

# やったこと。

　検索したときもAutoPagerが機能するようにした。

　厄介なことに全件のときと検索のときとでSQLが異なる。しかも検索のときはキーワードという引数が必要になるため、全件のときと異なるコードになる。

全件
```sql
select * from comments order by created desc limit ${limit} offset ${offset};
```

検索
```sql
select * from comments where content like '%${keyword}%' order by created desc limit ${limit} offset ${offset};
```

　それぞれの件数を取得するSQLも次のように用意した。

```sql
select count(*) from comments;
```
```sql
select count(*) from comments where content like '%${keyword}%';
```

　これをElectronのIPC通信用インタフェースとしてmain.jsとpreload.jsに実装した。今回追記したのは検索用のもの。

```javascript
ipcMain.handle('searchPage', async(event, keyword, limit, offset) => {
    const sql = `select * from comments where content like '%${keyword}%' order by created desc limit ${limit} offset ${offset};`
    const res = lib.get(`DB`).exec(sql)
    return (0 === res.length) ? null : res[0].values
})
ipcMain.handle('searchCount', async(event, keyword) => {
    const res = lib.get(`DB`).exec(`select count(*) from comments where content like '%${keyword}%';`)
    return (0 === res.length) ? res : res[0].values[0][0]
})
```
```javascript
searchPage:async(keyword, limit, offset)=>await ipcRenderer.invoke('searchPage', keyword, limit, offset),
searchCount:async(keyword)=>await ipcRenderer.invoke('searchCount', keyword),
```

## 全件 `auto-pager-calc.js`

　全件から20件ずつ取得するクラス。

```javascript
class AutoPagerCalc {
    async clear() {
        this.limit = 20
        this.page = -1
        this.offset = this.limit * this.page
        this.count = await this.getCount()
    }
    async next() {
        if (this.offset < this.count && this.limit < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            return true
        } else { return false }
    }
    async getPage() { return await window.myApi.getPage(this.limit, this.offset) }
    async getCount() { return await window.myApi.count() }
}
```

## 検索 `auto-pager-calc-search.js`

　全件のそれを継承した。呼び出すSQLメソッドを検索のそれに変更した。20件ずつ取得するところは共通。

```javascript
class AutoPagerCalcSearch extends AutoPagerCalc {
    constructor(searchElQuery) {
        super()
        this.searchElQuery = searchElQuery
    }
    async getPage() { return await window.myApi.searchPage(document.querySelector(this.searchElQuery).value, this.limit, this.offset) }
    async getCount() { return await window.myApi.searchCount(document.querySelector(this.searchElQuery).value) }
}
```

　というのが理想だった。実際は検索キーワードの取得は`document.querySelector(this.searchElQuery).value`ではできない。正確には`input`イベント発生時の値を取得できない。なのでメソッドの引数としてイベント発火時に渡されたものを受け取る必要がある。そのせいで引数が必要になり、親クラスと異なるインタフェースになってしまう。メソッド名がおなじで引数や戻り値がちがうもの、すなわちオーバーロードである。

　だがじつはJavaScriptはオーバーロードができない仕様だった。親のメソッドが呼ばれてしまう。

　なのでやむなくメソッド名を変えて引数をつけた。もう完全に別名。そのせいで呼び出し元を共通化できず、`if`や`switch`により分岐式を書かねばならなくなってしまった。これが嫌でメソッドの名前や引数をおなじにしたかったのに……。

```javascript
class AutoPagerCalcSearch extends AutoPagerCalc {
    constructor(searchElQuery) {
        super()
        this.searchElQuery = searchElQuery
    }
    // inputイベント時の値が取得できない。引数で受け取るしかない。
    //async getPage() { console.log('Search.getPage()', this.limit, this.offset); return await window.myApi.searchPage(document.querySelector(this.searchElQuery).value, this.limit, this.offset) }
    // 親メソッドが呼ばれてしまう。JSはオーバーロードできない仕様。
    //async getPage(keyword) { console.log('Search.getPage()', keyword, this.limit, this.offset); return await window.myApi.searchPage(keyword, this.limit, this.offset) }
    async getSearchPage(keyword) { console.log('Search.getPage()', keyword, this.limit, this.offset); return await window.myApi.searchPage(keyword, this.limit, this.offset) }

    async getCount() { console.log('Search.getCount()'); return await window.myApi.searchCount(document.querySelector(this.searchElQuery).value) }
```

## auto-pager.js

　上記をうまいこと呼び出す。

```javascript
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
        if (this.offset < this.count) {
            this.page++;
            this.offset = this.limit * this.page
            console.log(this.limit, this.offset)
            return await window.myApi.getPage(this.limit, this.offset)
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
```

　`this.mode`, `this.pager`あたりを追加した。コメントアウトは前回から消したもの。

　スクロールイベントを登録し、20件ずつ取得する処理を呼び出してページングを実現している。

　全件、検索、それぞれの場合のページング処理用インスタンスをもつ。指定されたモードのそれを使用する。モードは文字列でなくもっとスマートな設計がありそうな気がする。思いつかなかったのでこうした。

　なるだけ差異を吸収すべくクラスの継承をもちいた。呼出元は共通インタフェースをもちいて分岐処理をなくそうとした。しかし呼出の共通化はできなかった。原因はJavaScriptがオーバーロードできない仕様だったこと。プロトタイプチェーンの仕組みをよく知らないので超ハマった。しょせんはプロトタイプベース言語なので本場のオブジェクト指向言語とは別物。

# 他

## バグ修正

### text-to-html.js

```javascript
static countUrl(text) { // text内にあるURLの数を数える
    const regexp_url = /(([http|https|ipfs]?:\/\/[a-zA-Z0-9.\-_@:/~?%&;=+#',()*!]+))/g;
    const match = text.match(regexp_url)
    return (match) ? text.match(regexp_url).length : 0
    //return text.match(regexp_url).length
}
```

　URLらしき文字列がゼロ件のとき`length`がないと怒られたのでコメントアウト部分を修正した。これはURLを5件に制限する機能を実装したときに発見すべきバグだった。テストまったくしてないからね。

## テストデータ修正

　つぶやきのテストデータのうち`３１`としたつもりが`３２`になってた。`３２`が2つあったので修正した。

```sql
update comments set content='３１' where id=39;
```

<!--

## 次の最新20件があるか判定

前
```javascript
if (this.offset < this.count) {
```

後
```javascript
if (this.offset < this.count && this.limit < this.count) {
```

　今回、全件20件未満のときは次の最新がないと判断するよう条件を加えた。

-->

# ハマった所

## preload.js

　いつもコピペミスしてしまう所。`invoke`に渡す第一引数のテキストを修正し忘れてしまい、違うメソッドを呼び出していた。しかも類似メソッドのせいで気づくのにものすごい時間がかかってしまった。

```javascript
searchPage:async(keyword, limit, offset)=>await ipcRenderer.invoke('search', keyword, limit, offset),
```

```javascript
searchPage:async(keyword, limit, offset)=>await ipcRenderer.invoke('searchPage', keyword, limit, offset),
```

　ほかにも第二引数以降を修正し忘れることもよくある。

　このIPC通信用メソッドの作成は本当にただただ面倒で厄介なだけの嫌な作業。

## `for await`

　`for`文内で`await`するとき特殊な記法をせねばならない。

auto-pager.js
```javascript
for await (var m of this.MODES) { await this.pager[m].clear() }
```

　`for`の後ろに`await`を書き忘れたせいで`await`されていなかった。そのせいで`clear()`される前に`next()`が呼び出されてしまいハマった。

　こんな特殊な記法をしなくちゃいけないという事実そのものを忘れていた。

## `event.target.value`

　`input`イベント時、その要素の`value`を取得する。このときイベントのコールバック関数から与えられた`event.target.value`でないと正しい値を取得できない。

　要素のIDなどを引数に渡してほかのクラスのメソッド内で`document.querySelector(...).value`としても、イベント時の値は取得できない。そのせいでイベント時に取得できる値`event.target.value`をメソッドの引数として渡さねばならない。

　このとき呼び出すメソッドはつぶやきを取得するもの。そのとき状況によって引数なしで呼んだり、引数ありで呼んだりする。

条件|引数
----|----
全件|なし
検索|検索キーワード

　ダサいやり方としては`if`文で分岐すること。これが最も単純。というか、JavaScriptではそのように実装することしかできなかった。

　オブジェクト指向ではSteteパターンで共通メソッドを呼び出す方法がある。今回はそれで実装しようとしたのだが、JavaScriptにはインタフェースもなければオーバーロードすらできない。そのことを理解できておらず、中途半端な実装になってしまった。

　オーバーロードしたメソッドは呼び出されなかった。親側メソッドが呼ばれるだけで子は呼ばれなかった。たぶんプロトタイプチェーンをよく理解していないせいだと思う。

* [メソッドのオーバーロードはできない][]

[メソッドのオーバーロードはできない]:https://qiita.com/tadnakam/items/ae8e0e95107e1427983f#%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89%E3%81%AE%E3%82%AA%E3%83%BC%E3%83%90%E3%83%BC%E3%83%AD%E3%83%BC%E3%83%89

　結局、以下のように分岐処理を書いてメソッドを呼び分けるというダサい書き方になった。

```javascript
switch (this.mode) {
    case 'all': return await this.pager[this.mode].getPage(keyword)
    case 'search': return await this.pager[this.mode].getSearchPage(keyword)
    default: throw new Error(`this.modeは all か search にしてください。`)
}
```

　わざわざ別クラスにした意味ないのでは……。

　どうせ分岐処理を書かねばならないなら中間クラスをやめて以下のように直接呼び出したほうがマシだったような。

```javascript
switch (this.mode) {
    case 'all': return await window.myApi.getPage(limit, offset)
    case 'search': return await window.myApi.searchPage(keyword, limit, offset)
    default: throw new Error(`this.modeは all か search にしてください。`)
}
```

　本当は以下のように呼び出したかったのに。そのために中間クラスを書いたのに。

```javascript
return await this.pager[this.mode].getPage()
```

　せめてオーバーロードが使えたら以下でもよかったはずなのに。

```javascript
return await this.pager[this.mode].getPage(keyword)
```

　むしろ中間クラスのせいでムダに冗長化しただけという残念な結果になった。とはいえ、シンプルな`if`文にするとそれはそれで冗長になりそう。`limit`や`offset`の計算を`search`と`all`でそれぞれもたせるとか。

　いい感じにDRYに書けない。

　もしTypeScriptなら実装できたのだろうか。ググってみると一応できそうだった。でも書き方がダサい。しょせんはプロトタイプベースか。

* [TypeScriptで引数がないメソッドをオーバーライドしてオーバーロードする方法][]

[TypeScriptで引数がないメソッドをオーバーライドしてオーバーロードする方法]:https://qiita.com/isoken26/items/9babb331af8163e9a7ec

　JavaScriptの限界をみた。JavaやC#ならこのへんをスッキリ書けただろうに。

# 検索での課題

- [x] バグ修正。スクロールを最下端にやると全件取得の最新から20件を取得してしまう（検索キーワードと関係なく）
- [x] ページング実装。（最新順20件ずつ。`LIMIT`句、`OFFSET`句）
    - [ ] 大文字と小文字を区別したい（`LIKE`句では区別しない仕様）
    - [ ] メタ文字をエスケープしたい（`%`, `_`がメタ文字。`like '%10$%' escape '$'`）
- [ ] リファクタリング。Steteパターンで書けないのでシンプルな条件分岐にする
- [ ] 取得件数を表示したい
- [ ] FTS(Full Text Search)を使うべき
    - [ ] `AND`, `OR`検索したい
        - [ ] キーワードをスペース区切りにしたら各語ごとに`AND`をかけたい（現状はスペースもキーワードの一部になってしまう）
        - [ ] 表記ゆれに該当するものを`OR`検索したい
    - [ ] 一致率に応じて優先順位を算出したい
- [ ] スクロールバーにフォーカスするショートカットキーを設定したい
- [ ] 出力サイト側でも検索したい

　最低限やりたかったことはできた。ほかは未定。

　それ以前にJavaScriptの言語仕様をよくわかってないのが問題か。

