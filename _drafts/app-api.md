# APP-API

云储存web与原始接口整理如下

## 初始化信息

### 接口名

​	getAllInfos

#### 接口描述

​	APP进入web页面时所需的信息

#### 请求示例

```
{

}
```

#### 响应示例

```javascript
{
    "statusBarHeight" : 44,		//导航栏高度
    "currentLan" : "en",		//当前语言
    "defaultLan" : "zh-Hans",	//默认语言
    "primarColor" : "#50D0C1",	//主色系
    "ucsToken" :  "SDGSFGSGSGSGSSGHNJ",	//ucsToken
    "isOverseas" : 1, //是否为海外版	1:海外、0：国内
    "currentUcsDomain" : "https://ucs.uniview.com",//当地区域的ucs域名
    "currentEZValueDomain" : "https://EZValue.uniview.com",//当地区域的EZValue域名
    "currentPhoneSystem" : "ios", //当前手机系统	
}
```

## 调取支付

### 接口名

​	postPayInfos

#### 接口描述

​	调取支付

#### 请求示例

```javascript
{
	"tradeNo":"4964646461163165", //订单号
	"productId":"package1"	//套餐种类
}
```

#### 响应示例

​	说明：调用支付后就转APP处理了，APP支付失败显示对应信息，支付成功主动跳转至Web界面

```javascript
{
    
}
```

## 跳转APP页面

### 接口名

​	jumpToAPP

#### 接口描述

​	web跳转APP页面

#### 请求示例

```javascript
{
	"url":"/app/pages/a"
}
```

#### 响应示例

```javascript
{
}
```

## 订阅管理

### 接口名

​	manageSubscription

#### 接口描述

​	管理订阅

#### 请求示例

​	说明：web将用户操作行为传递给APP，APP根据其进行相应操作

```javascript
{
	"manage":0 //0:更改计划 1：取消订阅
}
```

#### 响应示例

```javascript
{
}
```

## 订单确认

### 接口名

​	confirmOrder

#### 接口描述

​	订单确认

​		APP支付成功后，跳转至Web 支付成功界面，需要去确认订单是否生效

​	流程

​		1、根据订单号去向EZValue确认订单

​		2、将套餐开通信息(tradeFinishFlag)传递给APP，如果tradeFinishFlag为0，则APP去向谷歌确认订单，确认后返回"PaySuccess":0；反之，不确认，直接返回"PaySuccess":1

​		3、web得到"PaySuccess":0，则去告诉EZValue，让其确认订单

#### 请求示例

​	说明：

```javascript
{
    "tradeNo":"4964646461163165", //订单号
	"tradeFinishFlag":0 //0:成功 1：失败
}
```

#### 响应示例

```javascript
{
    "tradeNo":"4964646461163165", //订单号
	"PaySuccess":0 //0:成功 1：失败
}
```

