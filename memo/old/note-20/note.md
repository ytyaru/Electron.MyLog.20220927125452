# Electronでつぶやきを保存する20

　検索機能を仮実装してみた。問題が山ほどあるとわかった。

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

# 情報源

* [Electron Chrome拡張機能サポート][]
* [mpurse][]
* [開発用拡張機能の読み込み (DevTools Extension, session)][]
* [CharlieAIO/extensions.js][]

[Electron Chrome拡張機能サポート]:https://www.electronjs.org/ja/docs/latest/api/extensions
[mpurse]:https://github.com/tadajam/mpurse
[開発用拡張機能の読み込み (DevTools Extension, session)]:https://zenn.dev/sprout2000/books/3691a679478de2/viewer/13449
[CharlieAIO/extensions.js]:https://gist.github.com/CharlieAIO/0fc4e3403d303301ae48e27088861493

# やったこと

　検索機能を仮実装してみた。Electronアプリ側で検索ボックスに入力したキーワードを含むつぶやきを全件表示する。

## SQL

　DBはSQLite3を使用している。検索は以下SQL文を発行することで行う。キーワードで部分一致したものが対象。

```sql
select * from comments where content like '%${keyword}%';
```

　これに最新順になるようソートをかける。

```sql
select * from comments where content like '%${keyword}%' order by created desc;
```

## IPC通信

　ElectronのIPC通信用インタフェースとして実装する。

### main.js

```javascript
ipcMain.handle('search', async(event, keyword) => {
    const res = lib.get(`DB`).exec(`select * from comments where content like '%${keyword}%' order by created desc;`)
    console.log(res)
    return (0 === res.length) ? null : res[0].values
})
```

### preload.js

```javascript
search:async(keyword)=>await ipcRenderer.invoke('search', keyword),
```

## 呼び出す

### index.html

　検索用テキストボックスを用意する。

```html
<input id="search" type="search" placeholder="検索">
```

### renderer.js

　検索用メソッドを呼び出す。

```javascript
const records = await window.myApi.search(e.target.value)
```

　`input`イベントで実行する。

イベント|意味
--------|----
`input`|1字入力するたび
`change`|Enterキーで決定するたび

　実際には色々ルート分岐する必要があった。

条件|結果
----|----
キーワードがない|最新20件表示する
検索結果がない|何も表示しない
ほか|検索されたつぶやきを全件表示する

```javascript
document.querySelector('#search').addEventListener('input', async(e)=>{
    if (0 < e.target.value.length) {
        console.log('検索キーワード：', e.target.value)
        const records = await window.myApi.search(e.target.value)
        console.log(records)
        if (records) {
            document.getElementById('post-list').innerHTML = records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], document.getElementById('address').value)).join('')
        } else { document.getElementById('post-list').innerHTML = '' }
    } else {
        const records = await window.myApi.getPage(20, 0)
        document.getElementById('post-list').innerHTML = records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], document.getElementById('address').value)).join('')
    }
})
```

　今回はまだAutoPagerは実装できなかった。それ以前に後述するバグがある。

# バグ

　AutoPagerとの兼ね合いでバグる。

　スクロールを最下端にやると全件取得の最新から20件を取得してしまう（検索キーワードと関係なく）。

　今はそういう実装なので、このへんを全面的に変えないとダメ。大変そう。

# 課題

* 大文字と小文字を区別したい（`LIKE`句では区別しない仕様）
* メタ文字をエスケープしたい（`%`, `_`がメタ文字。`like '%10$%' escape '$'`）
* 取得件数を表示したい
* ページングを実装したい（最新順20件ずつ）
    * `LIMIT`句、`OFFSET`句
* `LIKE`句による検索は遅い
    * FTS(Full Text Search)を使うべき
        * sql.js（ブラウザ）側でもFTSを使えるのか？
            * [Compiling Full Text Search (FTS5) Into sql.js (SQLite WASM Build)](https://blog.ouseful.info/2022/04/06/compiling-full-text-search-fts5-into-sqlite-wasm-build/)
            * 頑張ればできるかも？
* `AND`, `OR`検索したい
    * キーワードをスペース区切りにしたら各語ごとに`AND`をかけたい（現状はスペースもキーワードの一部になってしまう）
    * 表記ゆれに該当するものを`OR`検索したい
* 一致率に応じて優先順位を算出したい

　たかが検索なのだが、じつは深入りするとすごく大変。やりたいことが山のようにある。でもこれをすべて実装するとなると無謀。

　そこで最も簡単と思われる`LIKE`句による検索のみ仮実装してみた。それでも問題が残ってる。

