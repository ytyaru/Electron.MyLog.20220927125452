# Electronでつぶやき保存する14

　フォントサイズ・スライダーの範囲を適正値にして復活させた。最小、最大、現在値を表示した。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.MyLog.20220915100705

## インストール＆実行

```sh
NAME='Electron.MyLog.20220915100705'
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

* フォントサイズ・スライダーの範囲を適正値にして復活させた。最小、最大、現在値値を表示するようにした。

```html
<div id="line-of-chars-slider">
    <input id="line-of-chars" type="range" min="20" max="40" value="35" step="1"><span id="line-of-chars-now">35</span>字／行</span>
    <div id="line-of-chars-slider-values">
        <span id="line-of-chars-min">20</span>
        <span id="line-of-chars-max">38</span>
    </div>
</div>
```
```css
#line-of-chars {
    width:60%;
}
#line-of-chars-slider {
    line-height:16px;
    padding:;
}
#line-of-chars-slider-values {
    display: flex;
    justify-content: space-between;
    font-size:16px;
    width:60%;
}
```

　スライダーのサイズは適当に60%。その横に現在値を`N字／行`と表示する。本当はもっと綺麗にサイズ計算したいのだがとりあえず暫定値。

　スライダーの最小、最大値を表示する`<span>`を用意した。こんなのはスライダーUI自体に用意してもらいたいところだが存在しないので自作した。細かいところはJSで実装した。

　

# 気づいたこと

　フォントサイズの計算が微妙。大きくなりすぎる気がする。





















# やったこと

* ２画面にする（表示領域の幅が1280px以上）
* 一行あたりの表示字数を自動変更する（表示領域サイズに応じて）

## ２画面にする（表示領域の幅が1280px以上）

　表示領域の幅が1280px以上のとき画面を２分割する。本当はアス比16:9以上のときのような条件をつけるべきだがそれは未実装。

　左に入力フォーム、右につぶやき一覧を表示する。

```html
<body>
  <div id="input-form" class="half-screen">
    <!-- 左画面。ここに入力フォーム一式をぶちこむ -->
  </div>
  <div id="post-list" class="half-screen">
    <!-- 右画面。ここにつぶやき一覧をぶちこむ -->
  </div>
</body>
```

　CSSにはたくさんの工夫が必要だった。しかもJSで書き換える必要もある。なのでCSS変数を多用している。

```css
body {
    height: var(--body-height); /* 表示領域の高さ(document.documentElement.clientHeight) */
    display:var(--body-display); /* 1画面:block, 2画面:flex */
    overflow-x: none;
    overflow-y: none;
    padding: 0;
    margin: 0;
}
```

　左と右にはそれぞれ幅を表示領域の半分にしたCSSを付与する。このCSSをつけたり消したりすることで、１画面と２画面を切り替える。

```css
.half-screen {
    width: var(--half-width); /* (表示領域の幅÷２)−スクロールバー幅  (document.body.clientWidth) */
    overflow-y: auto;
    overflow-x: none;
}
```

　`renderer.js`で以下のように実装した。

```javascript
function splitScreen() {
    const h = document.documentElement.clientHeight
    const w = document.body.clientWidth 
    console.log('w:h', w, h)
    document.querySelector(':root').style.setProperty('--body-height', `${h}px`)
    document.querySelector(':root').style.setProperty('--half-width', `${parseInt(w/2)}px`);
    if (w < 1280) { // 1画面
        document.querySelector(':root').style.setProperty('--body-display', `block`)
        document.getElementById('input-form').classList.remove('half-screen')
        document.getElementById('post-list').classList.remove('half-screen')
        return 1
    }
    else { // 2画面
        document.querySelector(':root').style.setProperty('--body-display', `flex`)
        document.getElementById('input-form').classList.add('half-screen')
        document.getElementById('post-list').classList.add('half-screen')
        return 2
    }
}
```

## 一行あたりの表示字数を自動変更する（表示領域サイズに応じて）

```javascript
function setLineOfChars() { // 一行あたりの字数（20,25,30,35,38）
    const w = document.body.clientWidth
    const screenCount = splitScreen() // 1,2
    console.log('screenCount:', screenCount)
    const lineOfChars = Math.min(38, ((20+(5*(screenCount-1))) + (5*Math.floor((w-480)/(240*screenCount)))))
    console.log('lineOfChars:', lineOfChars)
    document.querySelector(':root').style.setProperty('--line-of-cahrs', `${lineOfChars}`);
}
```

　20,25,30,35,38の5パターンある。320px未満になると20より少なくなるが、フォントサイズは16pxを維持する。

# 気になること

* 横スクロールが出てしまう

## 横スクロールが出てしまう

　左画面のほうに横スクロールが出てしまう。表示しないようCSSを以下のようにセットしているのに。

style.css
```css
body {
    overflow-x: none;
    overflow-y: none;
}
#input-form, #post-list {
    overflow-x: none;
    overflow-y: none;
}
```

　よくみるとテキストエリア`<textarea>`が若干右側にはみ出てつぶされている。

　でもCSS側では`100%`なので超過しないと思うのだが。

ui.css
```css
textarea {
    width: 100%;
}
```

　これを`99%`のように少し下げるとスクロールが消える。でも、一行あたりの表示字数（字／行）が1字減ってしまう。

　字／行を減らさずにスクロールを消したい。フォントサイズ計算に余白か何かのサイズ分だけ減らせばいいのだろう。けど、一体なんのサイズなのかわからない。

## 誤差が出る

　画面サイズを変更していると誤差が出る。スクロールバーが端でなく少し内側に出たり、スクロールバーが出なかったりする。

　おそらくイベントの発火タイミングと表示領域サイズを取得するタイミングとの間で誤差ができるのだと思われる。

　できればキッチリしたいのだが、どうすればいいか不明。

















# フォントサイズJS計算

　スライダーUIで一行あたりの表示字数を20〜50字で設定させる。それを画面サイズで割って`font-size`とする。

　実際は余白や`letter-spacing`が関わってくるのでもっと複雑だが、大体そんな感じ。

## index.html

```html
<input id="line-of-chars" type="range" min="20" max="50" value="40" step="1"></input>
<span><span id="line-of-chars-count"></span>字／行</span>
```

## style.css

```css
:root {
    --line-of-chars:40;
    --font-size:calc(100vw / (var(--line-of-chars)));
    --font-size-code:calc(100vw / (var(--line-of-chars) * 2));
    --line-height:1.5em; /*1.5〜1.75em*/
    --letter-spacing:0.05em; /*0.05〜0.075em*/

}
body {
    font-size: var(--font-size);
    line-height: var(--line-height);
    letter-spacing: var(--letter-spacing);
}
```

## ui.css

```css
label, legend, form, fieldset, button, input, textarea, select, option, output {
    font-size: var(--font-size);
    line-height: var(--line-height);
    letter-spacing: var(--letter-spacing);
}
pre > code {
    font-size: var(--font-size-code);
}
```

## renere.js

### スライドUI

　一行あたりの表示字数を設定する。

```javascript
function setFontSize() {
    const MIN = 16
    const MAIN = document.querySelector('main:not([hidden])')
    const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
    const lineOfChars = document.getElementById('line-of-chars').value
    const fontSize = LINE_OF_PX / (lineOfChars * 1.05) - 0.1 // letter-spacing:0.05em
    document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
    document.getElementById('line-of-chars-count').innerText = lineOfChars
    document.querySelector(':root').style.setProperty('--font-size-code', `${Math.max((fontSize / 2), MIN)}px`);
}
document.querySelector('#line-of-chars').addEventListener('input', async()=>{ setFontSize() })
```

　スライダーUIを操作したときのイベント処理として、フォントサイズの計算とセットを実装した。

　計算はかなり雑。

* 字間である`letter-spacing`が`0.05em`固定であることを前提にしている
* 余白部分は勝手に表示されていてサイズ不明のため適当に`0.1em`固定値にしている
* `16px`以上であることを保証する（小さくなりすぎない）

### 窓リサイズ

　画面サイズに応じてスライダーの最大値を`20`〜`50`の間で決定する。

```javascript
function resize() {
    setFontSize()
    const MIN = 16
    const MAIN = document.querySelector('main:not([hidden])')
    const LINE_OF_PX = parseFloat(getComputedStyle(MAIN).getPropertyValue('inline-size'))
    const max = Math.max(Math.min(Math.floor(LINE_OF_PX / MIN), 50), 20) // 20〜50字
    console.log('max:', max)
    const preValue = document.getElementById('line-of-chars').value
    console.log('preValue:', preValue)
    document.getElementById('line-of-chars').max = max
    const lineOfChars = document.getElementById('line-of-chars').value
    console.log('lineOfChars:', lineOfChars)
    if (max < preValue) {
        document.getElementById('line-of-chars').value = max
        document.getElementById('line-of-chars-count').innerText = max
        document.getElementById('line-of-chars').dispatchEvent(new Event('input', { bubbles: true, cancelable: true,}))
    }
    document.getElementById('line-of-chars-max').innerText = max
}
let timeoutId = 0
window.addEventListener("resize", function (e) { // 画面リサイズ時に字／行の最大値を計算・設定する
    clearTimeout(timeoutId);
    timeoutId = setTimeout(()=>{ resize() }, 500); // 500ms
})
```

　もしスライダーの値が最大値より大きくなってしまったら、スライダーの値を最大値にセットする。

　リサイズイベントが大量に発行され、動作が重くなってしまった。そこでリサイズ処理が完了したとき最後に一回だけ実行するよう実装した。

* [【JavaScript】ウィンドウのリサイズ完了後に処理を実行する][]

[【JavaScript】ウィンドウのリサイズ完了後に処理を実行する]:https://into-the-program.com/javascript-run-after-resize/


