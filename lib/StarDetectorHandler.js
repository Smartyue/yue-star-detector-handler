/**
 * Created by yuanjianxin on 2018/5/28.
 */
const crypto = require('crypto');
const HttpUtil=require('yue-http-util');
module.exports=class StarDetectorHandler{

    static get instance(){
        if(!StarDetectorHandler._instance)
            StarDetectorHandler._instance=new StarDetectorHandler();
        return StarDetectorHandler._instance;
    }

    constructor(){
        this.baseUrl='https://sgrest.star-detector.starwin.tech';
        this.accessKey=null;
        this.accessSecret=null;
        this.hours=24;//超时时间 24小时
        this.signature=null;//签名
        this.token=null;
        this.expireTime=null;
        this.isInited=false;
    }

    init({accessKey,accessSecret}){
        this.accessKey=accessKey;
        this.accessSecret=accessSecret;
        this.isInited=true;
    }

    /**
     * 签名
     * @returns {string|*|null}
     */
    get cryptoSignature(){
        if(!this.isInited) throw new Error(`==StarDetector need init first!==`);
        if(this.signature!==null)
            return this.signature;
        let str=this.accessSecret+this.accessKey;
        let sign = crypto.createHash('SHA256');
        sign.update(str);
        this.signature=sign.digest('hex').toUpperCase();
        return this.signature;
    }

    async getToken() {
        if (this.token && this.expireTime && this.expireTime > Date.now())
            return this.token;

        let method="GET";
        let url=this.baseUrl+'/token';
        let data={
            key:this.accessKey,
            hours:this.hours,
            signature:this.cryptoSignature
        };
        try{
            let res=await HttpUtil.instance.sendRequest(method,url,data,{});
            if(res && res.code=="success"){
                this.token=res.detail.token;
                this.expireTime=parseInt(res.detail.expireTime.epochSecond)*1000;
                return this.token;
            }
            console.error('==GET TOKEN Error==',res);
        }catch (e){
            console.error('==Something Error==',e);
        }

    }

    async dispatch({mobile,realName,credentialNo,amount,applyTime}){
        let method="POST";
        let url=this.baseUrl+'/pre-monitor';
        let data={
            mobile,realName,credentialNo,amount,applyTime
        };
        let headers={
            'Content-Type':'application/x-www-form-urlencoded',
            'X-AUTH-TOKEN':await this.getToken()
        };

        try{
            return await HttpUtil.instance.sendRequest(method,url,data,headers);
        }catch (e){
            console.error('=====Error',e);
        }
    }



};