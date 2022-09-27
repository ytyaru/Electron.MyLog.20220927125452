# ElectronでChrome拡張機能mpurseが使えなかった

　拡張機能サポート機能を使ったが、既存のウォレット情報が表示されず、APIも使えなかった。

<!-- more -->

# ブツ

* [リポジトリ][]

[リポジトリ]:https://github.com/ytyaru/Electron.Electron.MyLog.20220918093541

## インストール＆実行

```sh
NAME='Electron.Electron.MyLog.20220918093541'
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

1. [Electron Chrome拡張機能サポート][]を読む
2. Chromium拡張機能ディレクトリを調べる
3. `main.js`に実装する

## 1. [Electron Chrome拡張機能サポート][]を読む

```javascript
const { session } = require('electron')

session.loadExtension('path/to/unpacked/extension').then(({ id }) => {
  // ...
})
```

　上記のように拡張機能のパスをセットする必要があるようだ。

　また、すべての拡張機能をサポートしているわけではないとも明記されていた。[mpurse][]がサポートされるかどうかは試してみないとわからない。

## 2. Chromium拡張機能ディレクトリを調べる

　必要なパスの書式は次の通り。

* `{Chromium設定}/{プロファイル}/Extensions/{ExtId}/{Version}`

パス|値
----|--
Windows|`C:\Users\{username}\AppData\Local\Google\Chrome\User Data\{プロファイル}/Extensions/{ExtId}`
Mac|`Users/{username}/library/Application Support/Google/Chrome/{プロファイル}/Extensions/{ExtId}`
Linux|`~/.config/chromium/{プロファイル}/Extensions/{ExtId}`

表記|意味
----|----
`~`|`/home/{username}`
`{username}`|OSのユーザ名
`{プロファイル}`|`Default`または`Profile [1-9]+`
`{ExtId}`|拡張機能のID（32字の英字）

### [mpurse][]のIDを調べる

　結論からいうと`/Extensions/{ExtId}/{Version}/manifest.json`内の`name`が`Mpurse`の`{ExtId}`がそれである

　`{Chromium設定}/{プロファイル}/Extensions/{ExtId}`のうち`Extensions`まで特定したら、次は[mpurse][]のID`{ExtId}`を調べる。

* `Extensions`配下にはそのプロファイルにインストールされた拡張機能の数だけディレクトリがある
* そのディレクトリ名は32字の英字である
* `{Version}`はその拡張機能のバージョン値である
* 拡張機能ごとにひとつmanifest.jsonファイルがある

## 3. `main.js`に実装する

* `src/js/main.js`
    * `/home/pi/.config/chromium/Profile 3/Extensions/ljkohnccmlcpleonoiabgfggnhpkihaa/0.5.1_0`

### 3-1. 失敗１

```javascript
const { session } = require('electron')

session.loadExtension('path/to/unpacked/extension').then(({ id }) => {
  // ...
})
```

　公式サイトに書いてあった通り`session.loadExtension()`すると以下エラーになった。

```sh
(node:8908) UnhandledPromiseRejectionWarning: TypeError: session.loadExtension is not a function
```

### 3-2. 失敗２

　ググって探した所`session.defaultSession.loadExtension()`が正しいようだ。公式が嘘を書くのやめてほしい。これ何度目だ。

　パスの直下に`manifest.json`がないと以下のようなエラーになる。ちゃんと`{ExtId}/{Version}`もいれてパス指定すること。公式には`path/to/unpacked/extension`とあり、それじゃわからねーよと言いたい。

```sh
(node:8992) UnhandledPromiseRejectionWarning: Error: Loading extension at /home/pi/.config/chromium/Default/Extensions failed with: マニフェスト ファイルが見つからないか読み取れません
```

### 3-3. 起動したがウォレット表示されずAPIも使えない

　[CharlieAIO/extensions.js][]を参考にした。以下コード抜粋。

```javascript
function popupMpurse() {
    const ID = 'ljkohnccmlcpleonoiabgfggnhpkihaa'
    const w = new BrowserWindow({
        title: 'Mpurse',
        width: 400,
        height: 640,
        type: 'popup',
    });
    w.loadURL(`chrome-extension://${ID}/index.html`);
}
```

```javascript
app.whenReady().then(async() => {
    const json = await session.defaultSession.loadExtension(`/home/pi/.config/chromium/Profile 3/Extensions/ljkohnccmlcpleonoiabgfggnhpkihaa/0.5.1_0`);
    console.log('session.loadExtension:', json)
    createWindow()
    popupMpurse()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})
```

　これで起動時[mpurse][]が表示される。ただ、新規ウォレット作成する画面になってしまう。

　あれ、すでにウォレットは作成済みのはずなんだけど……。

![mpurse-electron.png][]

　ブラウザで表示すると以下のようになるのになる。↓と同じようになることを期待していたのに。何がダメなの？

拡張機能ボタンを押した時

![mpurse-browser.png][]

`chrome-extension://ljkohnccmlcpleonoiabgfggnhpkihaa/index.html`をURL欄に入力した時

![mpurse-browser-2.png][]

[mpurse-electron.png]:memo/mpurse-electron.png
[mpurse-browser.png]:memo/mpurse-browser.png
[mpurse-browser-2.png]:memo/mpurse-browser-2.png
[mpurse-api-undefined.png]:memo/mpurse-api-undefined.png

　たぶん[mpurse][]はローカルのどこかにウォレット情報をファイル保存している。その読み取りがElectronだとできなくて新規作成画面になってしまうのだろう。

　でも、どこにウォレット情報があるかわからない。`.../{プロファイル}/Local Extension Settings/{ExtId}/`配下にはログっぽいものしかなかったし。

　既存のウォレットを取り込むにはどうしたらいいのか。[mpurse][]のインポート機能は新しくウォレットを作ることになってしまうっぽいので違う。

* [Mpurse アドレス（秘密鍵）インポート方法][]
* [Mpurseの特徴とインポート方法の解説][]

[Mpurse アドレス（秘密鍵）インポート方法]:https://spotlight.soy/detail?article_id=avg2yiq6d
[Mpurseの特徴とインポート方法の解説]:https://monacuration.com/post-3060/

　そうでなく、既存のウォレットを使いたいだけ。そもそも、なぜ使えないのか謎。Electronでは動作しないのかな？　それとも、単にウォレットデータが参照またはコピーされていないだけ？　わからん。

　[mpurse][] APIも使えなかった。

![mpurse-api-undefined.png][]

　一応、拡張機能をロードしたあとに`window.mpurse.updateEmitter.removeAllListeners()...`をやったが、やはりダメ。

```javascript
...
const json = await session.defaultSession.loadExtension(`/home/pi/.config/chromium/Profile 3/Extensions/ljkohnccmlcpleonoiabgfggnhpkihaa/0.5.1_0`, {allowFileAccess:true});
try {
    window.mpurse.updateEmitter.removeAllListeners()
      .on('stateChanged', isUnlocked => console.log(isUnlocked))
      .on('addressChanged', address => console.log(address));
} catch(e) { console.debug(e) }
createWindow()
popupMpurse()
...
```

# 結論

　Electronでは[mpurse][]が使えない。

* [mpurse][]の既存ウォレットが使えない
* [mpurse][] APIが使えない

　もしかしたら新しいウォレットを作れば使えるのかもしれない。でも、私は既存のウォレットが使いたかった。それにAPIも使えないから投げモナボタンが機能しない。

