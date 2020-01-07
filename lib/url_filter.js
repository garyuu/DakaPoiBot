const blacklist = {
    "facebook": [
        'eid',
        '__xts__[0]',
        '__tn__',
        'hc_ref'
    ],
    "twitter": [
        'ref_src',
        'ref_url'
    ]
}
class URLFilter { 
    filter(url) { 
        url = url.replace("m.facebook", "facebook");
        const location = new URL(url);
        for (let host in blacklist) { 
            if (location.host.includes(host)) {
                const params = location.searchParams;
                for (let name of blacklist[host])
                    if (params.get(name) != null)
                        params.delete(name);
                break;
            }
        }
        return location.toString();
    }
}

module.exports = new URLFilter();