# Electronでつぶやき保存する16

　AutoPagerを実装した。つぶやきを20件ずつ表示し、スクロール末尾まで到達すると次の20件を追加する。それを最後まで繰り返す。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220915121744

## インストール＆実行

```sh
NAME='Electron.MyLog.20220915121744'
git clone https://github.com/ytyaru/$NAME
cd $NAME
npm install
npm start
```

### 準備

1. [GitHubアカウントを作成する](https://github.com/join)
1. `repo`スコープ権限をもった[アクセストークンを作成する](https://github.com/settings/tokens)
1. [インストール＆実行](#install_run)してアプリ終了する
	1. `db/setting.json`ファイルが自動作成される
1. `db/setting.json`に以下をセットしファイル保存する
	1. `username`:任意のGitHubユーザ名
	1. `email`:任意のGitHubメールアドレス
	1. `token`:`repo`スコープ権限を持ったトークン
	1. `repo.name`:任意リポジトリ名
	1. `address`:任意モナコイン用アドレス
1. `dst/mytestrepo/.git`が存在しないことを確認する（あれば`dst`ごと削除する）
1. GitHub上に同名リモートリポジトリが存在しないことを確認する（あれば削除する）

### 実行

1. `npm start`で起動またはアプリで<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>キーを押す（リロードする）
1. `git init`コマンドが実行される
	* `repo/リポジトリ名`ディレクトリが作成され、その配下に`.git`ディレクトリが作成される
1. [createRepo][]実行後、リモートリポジトリが作成される

### GitHub Pages デプロイ

　アップロードされたファイルからサイトを作成する。

1. アップロードしたユーザのリポジトリページにアクセスする（`https://github.com/ユーザ名/リポジトリ名`）
1. 設定ページにアクセスする（`https://github.com/ユーザ名/リポジトリ名/settings`）
1. `Pages`ページにアクセスする（`https://github.com/ユーザ名/リポジトリ名/settings/pages`）
    1. `Source`のコンボボックスが`Deploy from a branch`になっていることを確認する
    1. `Branch`を`master`にし、ディレクトリを`/(root)`にし、<kbd>Save</kbd>ボタンを押す
    1. <kbd>F5</kbd>キーでリロードし、そのページに`https://ytyaru.github.io/リポジトリ名/`のリンクが表示されるまでくりかえす（***数分かかる***）
    1. `https://ytyaru.github.io/リポジトリ名/`のリンクを参照する（デプロイ完了してないと404エラー）

　すべて完了したリポジトリとそのサイトの例が以下。

* [作成DEMO][]
* [作成リポジトリ][]

[作成DEMO]:https://ytyaru.github.io/Electron.MyLog.20220908121018.Site/	
[作成リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220908121018.Site

# やったこと

　AutoPagerを実装した。つぶやきを20件ずつ表示する。スクロール末尾まで到達すると次の20件を表示する。それを最後まで繰り返す。

　これまでは最初に全件表示していた。だが、それだともし1000件あったらとても長い時間かかってしまう。初回表示を高速化するため最新順に20件ずつ表示するようにした。

1. SQLite3で20件ずつ取得する
2. スクロールバーの末尾到達判定
3. つぶやきを20件ずつHTML表示する

　最大20件ずつ取得するには以下。

```sql
select * from comments order by created desc limit ${limit} offset ${offset};
```

　スクロールバーの末尾到達判定は以下。

```javascript
#isFullScrolled(event) {
    const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
    const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
    return positionWithAdjustmentValue >= event.target.scrollHeight
}
```

　ほか、細かい計算、イベントやDOM、パフォーマンス調整処理を実装した。

## 1. SQLite3で20件ずつ取得する

```sql
select * from comments order by created desc limit ${limit} offset ${offset};
```

項目|意味|例
----|----|--
`limit`|最大取得件数|`20`
`offset`|先頭からすっ飛ばす件数|`0`

### Electron IPC通信インタフェース化する

#### main.js

```javascript
ipcMain.handle('getPage', async(event, limit, offset) => {
    const res = lib.get(`DB`).exec(`select * from comments order by created desc limit ${limit} offset ${offset};`)
    console.log(res)
    return (0 === res.length) ? res : res[0].values
})
```

#### preload.js

```javascript
getPage:async(limit, offset)=>await ipcRenderer.invoke('getPage', limit, offset),
```

## 2. スクロールバーの末尾到達判定

　計算式は以下。

```javascript
#isFullScrolled(event) {
    const adjustmentValue = 60 // ブラウザ設定にもよる。一番下までいかずとも許容する
    const positionWithAdjustmentValue = event.target.clientHeight + event.target.scrollTop + adjustmentValue
    return positionWithAdjustmentValue >= event.target.scrollHeight
}
```

　これをつぶやき一覧表示する親要素のスクロールイベント時に実行する。

```javascript
this.ui.addEventListener('scroll', async(event) => {
    if (this.#isFullScrolled(event)) { ... }
})
```

　ただしイベント発火回数が多くなりすぎて処理が重くなる。そのため200ms以内に完了した最後の一回のみ実行するようにする。

```javascript
this.ui.addEventListener('scroll', async(event) => {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(async()=>{
        if (this.#isFullScrolled(event)) { ... }
    }, 200);
})
```

## 3. つぶやきを20件ずつHTML表示する

　スクロール最下端に達するたび`#next()`を呼び出す。こいつで20件ずつ取得する。

```javascript
async #next() {
    console.log('AutoPager.next()')
    if (this.offset < this.count) {
        this.page++;
        this.offset = this.limit * this.page
        console.log(this.limit, this.offset)
        return await window.myApi.getPage(this.limit, this.offset)
    } else { return [] }
}
```

　すでに取得済みの件数だけすっ飛ばす。その値`offset`は`limit * page`で計算する。`limit`は一回あたりの取得件数20件のこと。`page`はスクロール最下端に到達した回数。

項目|意味|例
----|----|--
`limit`|最大取得件数|`20`
`page`|スクロール最下端に到達した回数|`0`
`offset`|先頭からすっ飛ばす件数|`0`

　該当するレコードを取得したら全件HTML化する。すべて文字列として作成したあと末尾に追記する。[insertAdjacentHTML][]を使って。

```javascript
#toHtml(records) {
    console.log(records)
    this.ui.insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], this.setting.mona.address)).join(''))
```

[insertAdjacentHTML]:https://developer.mozilla.org/ja/docs/Web/API/Element/insertAdjacentHTML

　あとはそれをスクロールイベント時に呼び出すようにすれば完成。

```javascript
this.ui.addEventListener('scroll', async(event) => {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(async()=>{
        if (this.#isFullScrolled(event)) {
            this.#toHtml(await this.#next())
        }
    }, 200);
})
```

### auto-pager.js

　20件ずつ表示するAutoPager処理をまとめたクラスを書いた。

```javascript
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
```

　あとはこれを`renderer.js`で以下のように呼び出せばいい。

```javascript
const pager = new AutoPager(setting)
await pager.setup() 
```

　以前までは以下のように全件取得していた。これを削除しておく。

```javascript
document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
```

