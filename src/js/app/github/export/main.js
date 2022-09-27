window.addEventListener('DOMContentLoaded', async(event) => {
    const setting = {mona:{address:'MEHCqJbgiNERCH3bRAtNSSD9uxPViEX1nu'}}
    const pager = new AutoPager(setting)
    await pager.setup() 
    //document.getElementById('post-list').innerHTML = await new DbToHtml().toHtml()
});
