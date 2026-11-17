import config from "../config/config";

const getOssToken = async (cb) => {
    // TODO: 请求 OSS token 后执行 cb(res)
};

const upload = (scene = 'img', success) => {
    wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success(resp) {
            let tempFilePath = resp.tempFiles[0].tempFilePath;

            getOssToken((oss) => {
                let key = `xcx-demo/${scene}/${+new Date()}-${Math.floor(Math.random() * (+new Date()))}`;
                
                wx.uploadFile({
                    url: config.OSS_UPLOAD_HOST,
                    filePath: tempFilePath,
                    name: 'file',
                    formData: {
                        key: key,
                        policy: oss.policy,
                        OSSAccessKeyId: oss.OSSAccessKeyId,
                        signature: oss.signature,
                        'x-oss-security-token': oss['x-oss-security-token'],
                    },
                    success: () => {
                        let url = `${config.OSS_HOST}/${key}`;
                        success && success(url);
                    },
                    fail: (err) => {
                        console.log('=-= upload err', err);
                    }
                })
            });
        }
    });
};

export default upload;