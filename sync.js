const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// 这些变量会从 GitHub 的“保险箱”里读取
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
    try {
        console.log("正在获取数据...");
        // 请求一个无需复杂验证的镜像接口
        const res = await axios.get('https://mcree.top/api/lottery/ssq/latest');
        const data = res.data.data;

        const drawData = {
            issue_no: data.issue,
            draw_reds: data.red.split(',').map(Number),
            draw_blue: Number(data.blue),
            draw_date: data.drawTime
        };

        console.log(`拿到数据了：第 ${drawData.issue_no} 期`);

        const { error } = await supabase
            .from('draw_history')
            .upsert([drawData], { onConflict: 'issue_no' });

        if (error) throw error;
        console.log('✅ 数据库更新成功！');
    } catch (err) {
        console.error('❌ 出错了:', err.message);
        process.exit(1);
    }
}
run();
