const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    console.log("🚀 正在启动备用同步方案...");
    try {
        // 换用一个更稳定的公共彩票接口镜像
        const res = await axios.get('https://m.789789.tv/api/lottery/draw-list?lotteryType=1', {
            timeout: 10000
        });

        if (!res.data || !res.data.data) {
            throw new Error("接口返回格式不正确");
        }

        const latest = res.data.data[0];
        console.log(`📡 抓取成功！期号: ${latest.issue}`);

        const drawData = {
            issue_no: latest.issue,
            draw_reds: latest.red.split(',').map(Number),
            draw_blue: Number(latest.blue),
            draw_date: latest.drawTime
        };

        console.log(`📊 解析号码: 红球[${drawData.draw_reds}] 蓝球[${drawData.draw_blue}]`);

        const { error } = await supabase
            .from('draw_history')
            .upsert([drawData], { onConflict: 'issue_no' });

        if (error) throw error;
        console.log('✅ 数据库同步成功！');

    } catch (err) {
        console.error('❌ 同步失败:', err.message);
        // 如果第一个也失败，尝试最后一个兜底方案：福彩官网 API 的一种特殊写法
        console.log("尝试最后一种兜底手段...");
        try {
            const backup = await axios.get('http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawDetails?name=ssq&issueCount=1', {
                headers: { 'Referer': 'http://www.cwl.gov.cn/' }
            });
            const bData = backup.data.result[0];
            const drawData = {
                issue_no: bData.code,
                draw_reds: bData.red.split(',').map(Number),
                draw_blue: Number(bData.blue),
                draw_date: bData.date
            };
            await supabase.from('draw_history').upsert([drawData], { onConflict: 'issue_no' });
            console.log('✅ 兜底同步成功！');
        } catch (bErr) {
            console.error('💀 所有接口均失效，请检查网络或稍后再试。');
            process.exit(1);
        }
    }
}
run();
