# Electronでつぶやき保存する17

　公開するサイト側にもAutoPagerを実装した。削除後の取得を最新20件にした。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220916132748

## インストール＆実行

```sh
NAME='Electron.MyLog.20220916132748'
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

* 公開するサイト側にもAutoPagerを実装した
* 削除後の取得を最新20件にした

## 公開するサイト側にもAutoPagerを実装した

　つぶやきを20件ずつ表示し、スクロール末尾まで到達すると次の20件を追加する。それを最後まで繰り返す。

　コードは前回のElectron側のauto-pager.jsをそのまま使えるかと思ったが、違うコードを書かねばならなかった。おもにElectron側のIPC通信処理をブラウザ用に書き換える必要があった。

### コード追加

　サイト用コードとして`auto-pager.js`, `text-to-html.js`を追加した。その実装として`site-maker.js`に以下コードを追記した。

```javascript
window.myApi.cp(`src/js/app/github/export/auto-pager.js`, `dst/${this.setting.github.repo.name}/lib/mylog/auto-pager.js`, {'recursive':true, 'preserveTimestamps':true}),
window.myApi.cp(`src/js/app/github/export/text-to-html.js`, `dst/${this.setting.github.repo.name}/lib/mylog/text-to-html.js`, {'recursive':true, 'preserveTimestamps':true}),
```

　サイト用index.htmlに以下を追記した。

```html
<script src="lib/mylog/text-to-html.js"></script>
<script src="lib/mylog/auto-pager.js"></script>
```

　サイト用main.jsを以下のように修正した。アドレス値はElectronアプリで入力した値に置換する。

```javascript
window.addEventListener('DOMContentLoaded', async(event) => {
    const setting = {mona:{address:'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu'}}
    const pager = new AutoPager(setting)
    await pager.setup() 
    //document.getElementById('post-list').innerHTML = await new DbToHtml().toHtml()
});
```

### auto-pager.js

```javascript
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
```

　IPC通信処理は全面的に書き換えた。DB操作すべてがその対象。

　スクロール最下端到達判定処理`#isFullScrolled()`も書き換える必要があった。ここで苦労した。

```javascript
#isFullScrolled() { return ((document.body.clientHeight - window.innerHeight - 60) <= window.pageYOffset) }
```

## 削除後の取得を最新20件にした

　今度はElectronアプリ側の話。

　`renderer.js`で削除ボタンを押したあとのつぶやき取得を最新20件にした。

```javascript
const records = await window.myApi.getPage(20, 0)
document.getElementById('post-list').innerHTML = records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], document.getElementById('address').value)).join('')
```

　以前までは以下のように全件取得していた。

```javascript
document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
```

