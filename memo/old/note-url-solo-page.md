# Electronで指定したURLから単体ページを動的生成する。

　指定したつぶやきIDに応じたページを作る。

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

# やったこと

　指定したつぶやき一件だけを表示するページを動的生成するようにした。

* `log.html`, `log-rendere.js`ファイル追加
* `log.html?id=${id}`のようなURLで指定する

# URLルーティング

　指定したつぶやき一件だけを表示するページを動的生成する。つぶやきの指定はIDでする。ページを表示するURLは以下。

項目|値
----|--
理想|`https://domain.com/log/${id}`
実際|`https://domain.com/log.html?id=${id}`
静的HTML|`https://domain.com/${id}.html`

　本当は`log/${id}`のようなURLにしたかった。けれどこれをやるにはサーバサイドによる実装が必要らしい。

　静的HTMLにすれば実現できる。でもつぶやきの件数だけHTMLファイルが量産されディスク容量が逼迫する。また、最初からコードを実行し直すので実行パフォーマンスも悪い。ページ遷移するとき真っ白な画面になる。

　要求としては以下。

* なるだけ短く読みやすいURL
* なるだけ少ないファイル容量
* なるだけ速い実行速度

　細かくいうと以下。

* 指定したつぶやき一件を表示する（一覧と行き来する）
* ページをサーバなしで動的に生成したい（静的HTMLにするとファイル容量増大するため避けたい）
* パフォーマンスを向上させたい（ページ遷移せず必要な部分だけ動的生成する。共通部分はそのまま）

　上記を実現するにはどうしたらいいか。

　JSによる動的生成がポイント。毎回処理が必要になってしまうが、必要最小限にすることで実行速度・ファイル容量ともに効率化できる唯一の方法である。

　処理とURLを動的に紐付けることを「URLルーティング」と呼ぶようだ。私がやりたいことはまさにそれ。

## 懸念

　サーチエンジン・サービスにインデックスされないのでは？

* URLにクエリ`?`が含まれいているとき
* JSで動的生成されるとき

### べつにいいか

　今回の場合はいわゆるSPAなのでインデックスされなくてもかまわない。たかがつぶやき一件ごときのページなど、むしろインデックスされないほうがいい。

　もし将来、コメントを受け付ける機能が実装できたらつぶやき一件ごとに対するコメントを下にずらっと表示したい。そのための単一ページにすぎない。

　もっといえば単なる技術的な試行。一覧と単一ページ、それぞれを動的に作成できるか試したいだけ。それが有意義かどうかは二の次。

## 調査

　Electronであれば[webFrameMain][]を使えばURLルーティングできるかもしれない。でもGitHub Pagesにデプロイしたサイトのほうでも同じことがしたい。それを同じコードで実現したい。なのでElectronだけ実装できても意味がない。どちらかというとサイト側のほうで実現したい。

### 1. `.htaccess`ファイル＋History API

* [静的なサイトに JavaScript のルーターを導入する][]

　次のいずれかの方法になるようだ。現代ではHistory APIを使う方法のみ有効と思われる。

* `.htaccess`ファイル＋History API
* ハッシュバンURL（`example.com/#!articles/123`等）

　だが、GitHub PagesなどのHTTPSホスティングサービスでは`.htaccess`ファイルが使えないものも多い。

### 2. GitHub Page 404.html

　GitHub Pages専用の方法がズバリあった。

* [Github Pages で .htaccess の代わりに javascript のみでURLの rewrite を実現してパーマリンクを有効にする][]

1. 動的URL(HTMLとして存在しない)を`404.html`で受ける
1. `404.html`に仕込んだJSで存在する`post.html`にリダイレクトする
1. `post.html`のJSでURLを最初の動的URLに変更する（History API）

[webFrameMain]:https://www.electronjs.org/ja/docs/latest/api/web-frame-main
[静的なサイトに JavaScript のルーターを導入する]:https://qiita.com/masakielastic/items/2d43829edbac51ea366c
[Github Pages で .htaccess の代わりに javascript のみでURLの rewrite を実現してパーマリンクを有効にする]:https://qiita.com/h-kuwayama/items/6d429b3bd7f730e5b13b

　2回リダイレクトするので画面がちらつくだろうし、パフォーマンスもそれだけ落ちる。はたして実行速度や体感速度をさげてまで実現すべきか？

　綺麗でわかりやすいURLもたしかに大切だが、もっと重要なのは実行速度だろう。むしろそれを実現したくて動的生成している。

　なんとか両立できる方法はないものか。サーバを思い通りに操作できない以上、これしかないのだろう。

# クエリURL

　もう諦めてクエリ付きのURLで我慢する。

ファイル|用途
--------|----
`index.html`|一覧ページ
`log.html`|単一ページ

　本当はすべて`index.html`だけで動的HTML生成したい。でもそれだと静的HTMLで実現している部分まで動的生成せねばならない。改変量が多くなってしまうので、とりあえず単一ページを別に作ることにした。

　ページ遷移が発生するのでそのとき画面が白くなるし、最初からコードを実行しなおすためパフォーマンスも下がる。でも、とりあえずは一番簡単なこの方法でやってみる。

## log.html

　`log-rendere.js`を呼び出す。

```html
<a href="index.html">🔙</a>
<div id="post-list" class="half-screen"></div>
<script src="./src/js/log-renderer.js"></script>
```

### log-rendere.js

1. URLのクエリ`id`の値を取得する
1. 指定`id`に該当するつぶやきをDBから取得する
1. 取得したつぶやきをHTML表示する

```javascript
const url = new URL(location.href);
for (const key of ['id']) {
    if (!url.searchParams.has(key)) { throw 'URL引数エラー。クエリにidが必要です。'; }
}
const id = url.searchParams.get('id')
const r = await window.myApi.get(id)
document.getElementById('post-list').insertAdjacentHTML('afterbegin', (r) ? TextToHtml.toHtml(r[0], r[1], r[2], setting.mona.address) : `<p>存在しません。指定したid: ${id}</p>`)
```

### preload.js

　指定したIDのつぶやきをDBから取得する。(IPC通信インタフェース)

```javascript
get:async(id)=>await ipcRenderer.invoke('get', id),
```

### main.js

　指定したIDのつぶやきをDBから取得する。（実装）

```javascript
ipcMain.handle('get', async(event, id) => {
    const res = lib.get(`DB`).exec(`select * from comments where id = ${id};`)
    console.log(res)
    return (0 === res.length) ? null : res[0].values[0]
})
```

### text-to-html.js

　ついでに一覧で表示される各つぶやきのリンク`🔗`にも同じURLをセットした。

```javascript
static #toPermanentLink(id) { return `<a href="log.html?id=${id}">🔗</a>` }
```

　クエリ付きのURLをパーマリンクと呼ぶのかどうかはわからないが。

　ほかにも同じリンクを生成していた部分を修正した。

```javascript
static toBody(id, created, address=null, isFixedHtml=false) { return `<a id="id-${id}" class="anchor"></a><div class="mylog"><p></p><div class="mylog-meta">${this.toTime(created, isFixedHtml)}${(isFixedHtml) ? '' : this.#toDeleteCheckbox(id)}${this.#toPermanentLink(id)}${this.#toMpurseButton(address)}</div></div>` }
```

# サイト

　GitHub Pagesにデプロイするサイトのコードを生成する。

### site-maker.js

　サイト用コードファイルをコピーする。

```javascript
window.myApi.cp(`src/js/app/github/export/log.html`, `dst/${this.setting.github.repo.name}/log.html`, {'recursive':true, 'preserveTimestamps':true}),
window.myApi.cp(`src/js/app/github/export/log.js`, `dst/${this.setting.github.repo.name}/js/log.js`, {'recursive':true, 'preserveTimestamps':true}),
```

　モナコインのアドレスを書き換える。

```javascript
async #logCode() {
    const file = `log.js`
    const srcDir = `src/js/app/github/export/`
    const dstDir = `dst/${this.setting.github.repo.name}/js/`
    await window.myApi.mkdir(dstDir)
    let code = await window.myApi.readTextFile(`${srcDir}/${file}`)
    code = code.replace(/MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu/g, this.setting.mona.address)
    console.debug(code)
    await window.myApi.writeFile(`${dstDir}/${file}`, code)
}
```

### log.html

　`main.html`とほぼ同じ。`main.js`の代わりに`log.js`をロードする。

```html
<script src="js/log.js"></script>
```

### log.js

　Electron側とほぼ同じ。ただしIPC通信処理はすべてブラウザ用に書き換える。DB操作がおもにそれ。

1. URLのクエリ`id`の値を取得する
1. 指定`id`に該当するつぶやきをDBから取得する
1. 取得したつぶやきをHTML表示する

```javascript
window.addEventListener('DOMContentLoaded', async(event) => {
    const loader = new SqliteDbLoader()
    const url = new URL(location.href);
    for (const key of ['id']) {
        if (!url.searchParams.has(key)) { throw 'URL引数エラー。クエリにidが必要です。'; }
    }
    const id = url.searchParams.get('id')
    const r = await this.loader.DB.exec(`select * from comments where id = ${id};`)[0].values
    document.getElementById('post-list').insertAdjacentHTML('afterbegin', (1 === r.length) ? TextToHtml.toHtml(r[0], r[1], r[2], setting.mona.address) : `<p>存在しません。指定したid: ${id}</p>`)
});
```

### text-to-html.js

　ついでに削除用チェックボックスは不要なので削除した。

```javascript
static toHtml(id, content, created, address=null, isFixedHtml=false) {
    console.log(id, content, created, address, isFixedHtml)
    return `<a id="id-${id}" class="anchor"></a><div class="mylog"><p>${this.br(this.autoLink(content))}</p><div class="mylog-meta">${this.toTime(created, isFixedHtml)}${this.#toPermanentLink(id)}${this.#toMpurseButton(address)}</div></div>`
}
```

