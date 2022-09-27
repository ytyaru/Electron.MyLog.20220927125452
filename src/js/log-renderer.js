window.addEventListener('DOMContentLoaded', async(event) => {
    Loading.setup()
    console.log('DOMContentLoaded!!');
    const db = new MyLogDb()
    await window.myApi.loadDb(db.path)
    let setting = await Setting.load()
    console.log(setting)

    console.debug(location.href)
    const url = new URL(location.href);
    console.debug(url)
    console.debug(url.pathname)
    console.debug(url.pathname.match(/log\/[1-9][0-9]*/))
    for (const key of ['id']) {
        if (!url.searchParams.has(key)) { throw 'URL引数エラー。クエリにidが必要です。'; }
    }
    const id = url.searchParams.get('id')
    console.debug('id:', id)
    const r = await window.myApi.get(id)
    console.debug('r:', r)
    //document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
    //document.getElementById('post-list').insertAdjacentHTML('afterbegin', TextToHtml.toHtml(r[0], r[1], r[2], setting.mona.address))
    document.getElementById('post-list').insertAdjacentHTML('afterbegin', (r) ? TextToHtml.toHtml(r[0], r[1], r[2], setting.mona.address) : `<p>存在しません。指定したid: ${id}</p>`)

    /*
    const pager = new AutoPager(setting)
    await pager.setup() 
    const maker = new SiteMaker(setting)
    if (setting?.mona?.address) { document.getElementById('address').value = setting.mona.address }
    if (setting?.github?.username) { document.getElementById('github-username').value =  setting?.github?.username }
    if (setting?.github?.email) { document.getElementById('github-email').value =  setting?.github?.email }
    if (setting?.github?.token) { document.getElementById('github-token').value = setting?.github?.token }
    if (setting?.github?.repo?.name) { document.getElementById('github-repo-name').value = setting?.github?.repo?.name }
    //document.querySelector('#versions-table').innerHTML = await VersionsToHtml.toHtml()
    document.querySelector('#versions-table').insertAdjacentHTML('afterbegin', await VersionsToHtml.toHtml())
    // https://www.electronjs.org/ja/docs/latest/api/window-open
    document.querySelector('#open-repo').addEventListener('click', async()=>{
        window.open(`https://github.com/${document.getElementById('github-username').value}/${document.getElementById('github-repo-name').value}`, `_blank`)
    })
    document.querySelector('#open-site').addEventListener('click', async()=>{
        window.open(setting.github.repo.homepage, `_blank`)
    })
    const git = new Git(setting)
    const hub = new GitHub(setting)
    document.querySelector('#post').addEventListener('click', async()=>{
        try {
            await insert()
            await push()
        } catch (e) { Toaster.toast(e.message, true) }
    })
    document.querySelector('#delete').addEventListener('click', async()=>{
        try {
            const ids = Array.from(document.querySelectorAll(`#post-list input[type=checkbox][name=delete]:checked`)).map(d=>parseInt(d.value))
            console.debug(ids)
            const isDel = await db.delete(ids)
            if (!isDel) { return false }
            //document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
            const records = await window.myApi.getPage(20, 0)
            document.getElementById('post-list').innerHTML = records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], document.getElementById('address').value)).join('')
            //document.getElementById('post-list').insertAdjacentHTML('beforeend', records.map(r=>TextToHtml.toHtml(r[0], r[1], r[2], document.getElementById('address').value)).join(''))
            const uiSetting = await getUiSetting()
            console.log(uiSetting)
            await update(`つぶやき削除:${new Date().toISOString()}`, uiSetting)
            document.getElementById('content').focus()
        } catch (e) { Toaster.toast(e.message, true) }
    })
    document.querySelector('#content').addEventListener('input', async(e)=>{
        const length = db.LENGTH - e.target.value.length
        document.querySelector('#content-length').innerText = length
        const line = db.LINE - ((0 === e.target.value.length) ? 0 : document.querySelector('#content').value.split(/\r\n|\n/).length)
        document.querySelector('#content-line').innerText = line
        valid('#content-length', length, db.LENGTH)
        valid('#content-line', line, db.LINE)
        console.log(length)
        if (0 === e.target.value.length) {
            document.querySelector('#preview').innerHTML = ''
        } else {
            if (0 === document.getElementById('preview').children.length) {
                document.getElementById('preview').insertAdjacentHTML('afterbegin', TextToHtml.toBody(0, Math.floor(new Date().getTime()/1000), document.querySelector('#address').value))
            }
            document.querySelector('#preview div.mylog p').innerHTML = TextToHtml.toText(e.target.value)
            document.querySelector('#preview div.mylog time').remove()
            document.querySelector('#preview div.mylog-meta').insertAdjacentHTML('afterbegin',TextToHtml.toTime(Math.floor(new Date().getTime()/1000)))
        }
    })
    function valid(query, value, max) {
        if (value < 0) { error(query) }
        else if (value < max * 0.2) { warning(query) }
        else { clear(query) }
    }
    function warning(query) { clear(query); document.querySelector(query).classList.add('warning') }
    function error(query) { clear(query); document.querySelector(query).classList.add('error') }
    function clear(query) { document.querySelector(query).classList.remove('warning', 'error');  }
    document.querySelector('#save-setting').addEventListener('click', async()=>{
        setting = await Setting.load()
        setting.mona.address = document.getElementById('address').value
        setting.github.username = document.getElementById('github-username').value
        setting.github.email = document.getElementById('github-email').value
        setting.github.token = document.getElementById('github-token').value
        setting.github.repo.name = document.getElementById('github-repo-name').value
        //setting.github.repo.description = document.getElementById('github-repo-description').value
        //setting.github.repo.homepage = document.getElementById('github-repo-homepage').value
        //setting.github.repo.topics = document.getElementById('github-repo-topics').value
        await Setting.save(setting)
        Toaster.toast(`設定ファイルを保存した`); 
        console.log(setting)
    })
    //ocument.getElementById('line-of-chars').dispatchEvent(new Event('input'))
    //document.getElementById('line-of-chars').dispatchEvent(new Event('input', { bubbles: true, cancelable: true,}))
    //setFontSize() 
    resize() 
    //document.getElementById('line-of-chars').dispatchEvent(new Event('resize'))
    //document.getElementById('post-list').innerHTML = await db.toHtml(document.getElementById('address').value)
    document.getElementById('content').focus()
    document.getElementById('content-length').textContent = db.LENGTH
    document.getElementById('content-line').innerText = db.LINE
    async function getUiSetting() {
        return await Setting.obj(
            document.querySelector('#address').value, 
            document.querySelector('#github-username').value,
            document.querySelector('#github-email').value,
            document.querySelector('#github-token').value,
            document.querySelector('#github-repo-name').value,
        )
    }
    function isSetting(setting, uiSetting) {// Object.is(setting, uiSetting)だといつも上書きされてしまうので
        console.log('isSetting')
        console.log(setting)
        console.log(uiSetting)
        const a = JSON.stringify(Object.entries(setting).sort())
        const b = JSON.stringify(Object.entries(uiSetting).sort())
        console.log(a === b)
        console.log(b)
        console.log(b)
        return a === b;
    }
    async function overwriteSetting(uiSetting) {// ファイル／画面UIの値が違う
        console.log(`overwriteSetting()`, setting, uiSetting)
        if (!isSetting(setting, uiSetting)) {
            await Setting.save(uiSetting)
            console.debug(`setting.jsonを上書きした。`, setting, uiSetting)
            Toaster.toast(`設定ファイルを保存した`)
        } else { console.log(`設定ファイルの内容が同じなので上書きせず……`, setting, uiSetting) }
    }
    async function insert() {
        const insHtml = await db.insert(document.getElementById('content').value, document.getElementById('address').value)
        const insEl = new DOMParser().parseFromString(`${insHtml}`, "text/html");
        document.getElementById('post-list').prepend(insEl.body.children[1])
        document.getElementById('post-list').prepend(insEl.body.children[0])
        document.querySelector('#content').value = ''
        document.querySelector('#content').dispatchEvent(new Event('input'))
    }
    async function push() {
        const uiSetting = await getUiSetting()
        console.log(uiSetting)
        const exists = await git.init(uiSetting)
        if (!exists) { // .gitがないなら
            console.log(`リクエスト開始`)
            console.log(setting.github.username)
            console.log(setting.github.token)
            console.log(setting.github.repo)
            const res = await hub.createRepo({
                'name': document.getElementById('github-repo-name').value,
                'description': setting.github.repo.description,
                'homepage': setting.github.repo.homepage,
            }, uiSetting)
            console.log(res)
            await maker.make(uiSetting)
            await git.push('新規作成', uiSetting)
            await git.push('なぜか初回pushではasset/ディレクトリなどがアップロードされないので２回やってみる', uiSetting) 
            await overwriteSetting(uiSetting)
        }
        else { await update(`つぶやく:${new Date().toISOString()}`, uiSetting) }
        document.getElementById('content').focus()
    }
    async function update(message, uiSetting) {
        try {
            await window.myApi.cp(
                `src/db/mylog.db`,
                `dst/${setting.github.repo.name}/db/mylog.db`,
                {'recursive':true, 'preserveTimestamps':true})
            await git.push(message, uiSetting) 
            await overwriteSetting(uiSetting)
        } catch (e) { Toaster.toast(e.message, true) }
    }
    function splitScreen() {
        const h = document.documentElement.clientHeight
        const w = document.body.clientWidth 
        console.log('w:h', w, h)
        document.querySelector(':root').style.setProperty('--body-height', `${h}px`)
        document.querySelector(':root').style.setProperty('--half-width', `${parseInt(w/2)}px`);
        //if (w < 1280) { // 1画面
        if (w < 1024) { // 1画面
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
    // px/1字, 字間, 画面分割数
    // F=fontSizePx, L=letterSpacingEm S=screenCount
    function calcLineOfChars(F, L, S) { return parseInt(document.body.clientWidth / ((F*(1+L))*S)) }
    function setLineOfChars() { // 一行あたりの字数（20,25,30,35,38）
        const w = document.body.clientWidth
        const screenCount = splitScreen() // 1,2
        console.log('screenCount:', screenCount)
        //const lineOfChars = Math.min(38, ((20+(5*(screenCount-1))) + (5*Math.floor((w-480)/(240*screenCount)))))
        //console.log('lineOfChars:', lineOfChars)
        //document.querySelector(':root').style.setProperty('--line-of-cahrs', `${lineOfChars}`);
        
        const letterSpacing = parseFloat(getComputedStyle(document.querySelector(':root')).getPropertyValue('--letter-spacing'))
        const max = Math.min(40, calcLineOfChars(16, letterSpacing, screenCount))
        let rec = Math.min(38, calcLineOfChars(21, letterSpacing, screenCount))
        rec = (20 < max) ? rec : max
        rec = (20 <= max && rec < 20) ? 20 : rec
        let min = Math.max(max-10, calcLineOfChars(32, letterSpacing, screenCount))
        min = (20 < max) ? min : max
        min = (min < 20 && 20 <= max && 20 <= rec) ? 20 : min
        document.getElementById('line-of-chars').min = min
        document.getElementById('line-of-chars').max = max
        //document.getElementById('line-of-chars').value = lineOfChars
        document.getElementById('line-of-chars').value = rec
        document.getElementById('line-of-chars-min').innerText = min
        document.getElementById('line-of-chars-now').innerText = rec
        document.getElementById('line-of-chars-max').innerText = max
        document.querySelector(':root').style.setProperty('--line-of-cahrs', `${rec}`);
        console.log('min,rec,max',min, rec, max)
        console.log(`%c${rec}字／行　${w}px`, `color:green; font-size:16px;`)
    }
    function setFontSize() {
        setLineOfChars()
        const lineOfChars = parseInt(getComputedStyle(document.querySelector(':root')).getPropertyValue('--line-of-cahrs'))
        //const lineOfChars = document.getElementById('line-of-chars').value
        const fontSize = FontSize.calc(lineOfChars)
        document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
        //document.getElementById('line-of-chars-count').innerText = lineOfChars
        //document.querySelector(':root').style.setProperty('--font-size-code', `${FontSize.calcHalf(lineOfChars)}px`);
        console.log('setFontSize()', fontSize)
    }
    //document.querySelector('#line-of-chars').addEventListener('input', async()=>{ setFontSize() })
    document.querySelector('#line-of-chars').addEventListener('input', async(e)=>{
        document.getElementById('line-of-chars-now').innerText = e.target.value
        const fontSize = FontSize.calc(e.target.value)
        document.querySelector(':root').style.setProperty('--font-size', `${fontSize}px`);
        //document.querySelector(':root').style.setProperty('--font-size-code', `${FontSize.calcHalf(e.target.value)}px`);
        console.log('setFontSize()', fontSize)
    })
    function resize() {
        const fontSize = setFontSize()
    }
    let timeoutId = 0
    window.addEventListener("resize", function (e) { // 画面リサイズ時に字／行の最大値を計算・設定する
        clearTimeout(timeoutId);
        timeoutId = setTimeout(()=>{ resize() }, 200); // 500ms
    })
    */
})

