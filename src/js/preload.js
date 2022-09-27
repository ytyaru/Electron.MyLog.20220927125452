const {remote,contextBridge,ipcRenderer} =  require('electron');
contextBridge.exposeInMainWorld('myApi', {
    // System
    versions:async()=>await ipcRenderer.invoke('versions'),
    // SQL
    loadDb:async(filePath)=>await ipcRenderer.invoke('loadDb', filePath),
    createTable:async()=>await ipcRenderer.invoke('createTable'),
    sql:async(sql)=>await ipcRenderer.invoke('sql'),
    count:async()=>await ipcRenderer.invoke('count'),
    gets:async()=>await ipcRenderer.invoke('gets'),
    getPage:async(limit, offset)=>await ipcRenderer.invoke('getPage', limit, offset),
    get:async(id)=>await ipcRenderer.invoke('get', id),
    search:async(keyword)=>await ipcRenderer.invoke('search', keyword),
    searchPage:async(keyword, limit, offset)=>await ipcRenderer.invoke('searchPage', keyword, limit, offset),
    searchCount:async(keyword)=>await ipcRenderer.invoke('searchCount', keyword),
    insert:async(record)=>await ipcRenderer.invoke('insert', record),
    clear:async()=>await ipcRenderer.invoke('delete'),
    delete:async(ids)=>await ipcRenderer.invoke('delete', ids),
    exportDb:async()=>await ipcRenderer.invoke('exportDb'),
    // FileSystem Path
    rootDirName:async()=>await ipcRenderer.invoke('rootDirName'), // main.jsがあるディレクトリパス
    basename:async(path)=>await ipcRenderer.invoke('basename', path),
    dirname:async(path)=>await ipcRenderer.invoke('dirname', path),
    extname:async(path)=>await ipcRenderer.invoke('extname', path),
    pathSep:async()=>await ipcRenderer.invoke('pathSep'),
    // FileSystem
    exists:async(path)=>await ipcRenderer.invoke('exists', path),
    isFile:async(path)=>await ipcRenderer.invoke('isFile', path),
    isDir:async(path)=>await ipcRenderer.invoke('isDir', path),
    isLink:async(path)=>await ipcRenderer.invoke('isLink', path),
    isBlockDev:async(path)=>await ipcRenderer.invoke('isBlockDev', path),
    isCharDev:async(path)=>await ipcRenderer.invoke('isCharDev', path),
    isFifo:async(path)=>await ipcRenderer.invoke('isFifo', path),
    isSocket:async(path)=>await ipcRenderer.invoke('isSocket', path),
    mkdir:async(path)=>await ipcRenderer.invoke('mkdir', path),
    cp:async(src, dst, options)=>await ipcRenderer.invoke('cp', src, dst, options),
    readFile:async(path, kwargs)=>await ipcRenderer.invoke('readFile', path, kwargs),
    readTextFile:async(path, encoding='utf8')=>await ipcRenderer.invoke('readTextFile', path, encoding),
    writeFile:async(path, data)=>await ipcRenderer.invoke('writeFile', path, data),
    shell:async(command)=>await ipcRenderer.invoke('shell', command),
    // HttpRequest
    fetch:async(url, options)=>await ipcRenderer.invoke('fetch', url, options),
})

