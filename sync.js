const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const https = require('https');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// 创建一个可以忽略 SSL 错误的代理
const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function run() {
    console.log("🚀 启动终极强攻方案...");
    try {
        console.log("📡 正在向中国福彩官网请求数据...");
        
        // 使用福彩官网最稳定的查询接口
        const res = await axios.get('http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawDetails?name=ssq&issueCount=1', {
            timeout: 15000,
            httpsAgent: agent, // 忽略证书问题
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'http://www.cwl.gov.cn/kjxx/ssq/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (!res.data || !res.data.result || res.data.result.length === 0) {
            throw new Error("接口返回内容为空");
        }

        const latest = res.data.result[0];
        console.log(`✅ 抓取成功！期号: ${latest.code}`);

        const drawData = {
            issue_no: latest.code,
            draw_reds: latest.red.split(',').map(Number),
            draw_blue: Number(latest.blue),
            draw_date: latest.date
        };

        console.log(`📊 解析结果: ${drawData.issue_no} 期 - 红[${drawData.draw_reds}] 蓝[${drawData.draw_blue}]`);

        const { error } = await supabase
            .from('draw_history')
            .upsert([drawData], { onConflict: 'issue_no' });

        if (error) throw error;
        console.log('🎉 数据库同步成功！');

    } catch (err) {
        console.error('❌ 强攻也失败了:', err.message);
        process.exit(1);
    }
}

run();
