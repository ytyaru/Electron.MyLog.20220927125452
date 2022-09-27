window.addEventListener('DOMContentLoaded', async(event) => {
    const loader = new SqliteDbLoader()
    await loader.load()
    const url = new URL(location.href);
    for (const key of ['id']) {
        if (!url.searchParams.has(key)) {
            const msg = 'URL引数エラー。クエリにidが必要です。'
            document.getElementById('post-list').insertAdjacentHTML('afterbegin', `<p>${msg}</p>`)
            throw new Error(msg)
        }
    }
    const id = url.searchParams.get('id')
    console.debug('id:', id)
    if (!id.match(/[1-9][0-9]*/)) {
        const msg = `id値エラー。クエリidは1以上の整数値であるべきです。: ${id}`
        document.getElementById('post-list').insertAdjacentHTML('afterbegin', `<p>${msg}</p>`)
        throw new Error(msg)
    }
    //const r = await window.myApi.get(id)
    const r = await loader.DB.exec(`select * from comments where id = ${id};`)[0]
    console.debug('r:', r)
    document.getElementById('post-list').insertAdjacentHTML('afterbegin', (r) ? TextToHtml.toHtml(r.values[0][0], r.values[0][1], r.values[0][2], 'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu') : `<p>存在しません。指定したid: ${id}</p>`)
});
