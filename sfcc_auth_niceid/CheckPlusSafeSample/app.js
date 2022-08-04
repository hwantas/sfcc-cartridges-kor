const express = require("express"); // express 모듈 추가
const bodyParser = require("body-parser");  // body-parser 모듈 추가
const exec = require("child_process").exec; // child_process 모듈 추가
const app = express();
const port = 8888;

// NICE평가정보에서 발급한 본인인증 서비스 개발 정보(사이트 코드 , 사이트 패스워드)
var sSiteCode = "BV049";
var sSitePW = "0GiTkvrq02Wl";

//모듈의 절대 경로(권한:755 , FTP업로드방식 : binary)
// ex) sModulePath = "C:\\module\\CPClient.exe";
//     sModulePath = "/root/modile/CPClient";
var sModulePath = "aaa/CPClient";

var sAuthType = "M"; // 없으면 기본 선택화면, M(휴대폰), X(인증서공통), U(공동인증서), F(금융인증서), S(PASS인증서), C(신용카드)
var sCustomize 	= ""; //없으면 기본 웹페이지 / Mobile : 모바일페이지


// 본인인증 처리 후, 결과 데이타를 리턴 받기위해 다음예제와 같이 http부터 입력합니다.
// 리턴url은 인증 전 인증페이지를 호출하기 전 url과 동일해야 합니다. ex) 인증 전 url : https://www.~ 리턴 url : https://www.~
var sReturnUrl = "http://localhost:8888/checkplus_success";	// 성공시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
var sErrorUrl = "http://localhost:8888/checkplus_fail";	  	// 실패시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)

app.get("/", function(request, response) {
  response.send("sample index page");
});

app.get("/checkplus_main", function(request, response) {
  //업체 요청 번호 
  //세션등에 저장하여 데이터 위변조 검사 (인증후에 다시 전달) 
  var d = new Date();
  var sCPRequest = sSiteCode + "_" + d.getTime();

  //전달 원문 데이터 초기화
  var sPlaincData = "";
  //전달 암호화 데이터 초기화
  var sEncData = "";
  //처리 결과 메시지
  var sRtnMSG = "";

  sPlaincData = "7:REQ_SEQ" + sCPRequest.length + ":" + sCPRequest +
                "8:SITECODE" + sSiteCode.length + ":" + sSiteCode +
                "9:AUTH_TYPE" + sAuthType.length + ":" + sAuthType +
                "7:RTN_URL" + sReturnUrl.length + ":" + sReturnUrl +
                "7:ERR_URL" + sErrorUrl.length + ":" + sErrorUrl +
                "9:CUSTOMIZE" + sCustomize.length + ":" + sCustomize;
  console.log("["+sPlaincData+"]");
    
  var cmd = sModulePath + " " + "ENC" + " " + sSiteCode + " " + sSitePW + " " + sPlaincData;

  var child = exec(cmd , {encoding: "euc-kr"});
  child.stdout.on("data", function(data) {
    sEncData += data;
  });
  child.on("close", function() {
    //console.log(sEncData);
    //이곳에서 result처리 해야함. 
  
    //처리 결과 확인
    if (sEncData == "-1"){
      sRtnMSG = "암/복호화 시스템 오류입니다.";
    } else if (sEncData == "-2"){
      sRtnMSG = "암호화 처리 오류입니다.";
    } else if (sEncData == "-3"){
      sRtnMSG = "암호화 데이터 오류 입니다.";
    } else if (sEncData == "-9"){
      sRtnMSG = "입력값 오류 : 암호화 처리시, 필요한 파라미터 값을 확인해 주시기 바랍니다.";
    } else{
      sRtnMSG = "";
    }
    response.render("checkplus_main.ejs", {sEncData , sRtnMSG});
  });
});

app.use(bodyParser.urlencoded({extended: true}));
app.post("/checkplus_success", function(request, response) {
  var sEncData = request.body.EncodeData;
  var cmd = "";

  if( /^0-9a-zA-Z+\/=/.test(sEncData) == true){
    sRtnMSG = "입력값 오류";
    requestnumber = "";
    authtype = "";
    errcode = "";
    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  }

  if(sEncData != "") {
     cmd = sModulePath + " " + "DEC" + " " + sSiteCode + " " + sSitePW + " " + sEncData;
  }

  var sDecData = "";

  var child = exec(cmd , {encoding: "euc-kr"});
  child.stdout.on("data", function(data) {
    sDecData += data;
  });
  child.on("close", function() {
    //console.log(sDecData);
  
    //처리 결과 메시지
    var sRtnMSG = "";
    //처리 결과 확인
    if (sDecData == "-1"){
      sRtnMSG = "암/복호화 시스템 오류";
    } else if (sDecData == "-4"){
      sRtnMSG = "복호화 처리 오류";
    } else if (sDecData == "-5"){
      sRtnMSG = "HASH값 불일치 - 복호화 데이터는 리턴됨";
    } else if (sDecData == "-6"){
      sRtnMSG = "복호화 데이터 오류";
    } else if (sDecData == "-9"){
      sRtnMSG = "입력값 오류";
    } else if (sDecData == "-12"){
      sRtnMSG = "사이트 비밀번호 오류";
    } else {
      // 항목의 설명은 개발 가이드를 참조
      var requestnumber = decodeURIComponent(GetValue(sDecData , "REQ_SEQ"));     //CP요청 번호 , main에서 생성한 값을 되돌려준다. 세션등에서 비교 가능
      var responsenumber = decodeURIComponent(GetValue(sDecData , "RES_SEQ"));    //고유 번호 , 나이스에서 생성한 값을 되돌려준다.
      var authtype = decodeURIComponent(GetValue(sDecData , "AUTH_TYPE"));        //인증수단
      var name = decodeURIComponent(GetValue(sDecData , "UTF8_NAME"));            //이름
      var birthdate = decodeURIComponent(GetValue(sDecData , "BIRTHDATE"));       //생년월일(YYYYMMDD)
      var gender = decodeURIComponent(GetValue(sDecData , "GENDER"));             //성별
      var nationalinfo = decodeURIComponent(GetValue(sDecData , "NATIONALINFO")); //내.외국인정보
      var dupinfo = decodeURIComponent(GetValue(sDecData , "DI"));                //중복가입값(64byte)
      var conninfo = decodeURIComponent(GetValue(sDecData , "CI"));               //연계정보 확인값(88byte)
      var mobileno = decodeURIComponent(GetValue(sDecData , "MOBILE_NO"));        //휴대폰번호(계약된 경우)
      var mobileco = decodeURIComponent(GetValue(sDecData , "MOBILE_CO"));        //통신사(계약된 경우)
    }
    console.log(sDecData);

    response.render("checkplus_success.ejs", {sRtnMSG , requestnumber , responsenumber , authtype , name , birthdate , gender , nationalinfo , dupinfo , conninfo , mobileno , mobileco});
  });

});

app.get("/checkplus_success", function(request, response) {
  //chrome80 이상 대응
  var sEndData = request.param('EncodeData')
  var cmd = "";

  if( /^0-9a-zA-Z+\/=/.test(sEncData) == true){
    sRtnMSG = "입력값 오류";
    requestnumber = "";
    authtype = "";
    errcode = "";
    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  }

  if(sEncData != "")
  {
     cmd = sModulePath + " " + "DEC" + " " + sSiteCode + " " + sSitePW + " " + sEncData;
  }

  var sDecData = "";

  var child = exec(cmd , {encoding: "euc-kr"});
  child.stdout.on("data", function(data) {
    sDecData += data;
  });
  child.on("close", function() {
    //console.log(sDecData);
  
    //처리 결과 메시지
    var sRtnMSG = "";
    //처리 결과 확인
    if (sDecData == "-1"){
      sRtnMSG = "암/복호화 시스템 오류";
    }
    else if (sDecData == "-4"){
      sRtnMSG = "복호화 처리 오류";
    }
    else if (sDecData == "-5"){
      sRtnMSG = "HASH값 불일치 - 복호화 데이터는 리턴됨";
    }
    else if (sDecData == "-6"){
      sRtnMSG = "복호화 데이터 오류";
    }
    else if (sDecData == "-9"){
      sRtnMSG = "입력값 오류";
    }
    else if (sDecData == "-12"){
      sRtnMSG = "사이트 비밀번호 오류";
    }
    else
    {
      //항목의 설명은 개발 가이드를 참조
      var requestnumber = decodeURIComponent(GetValue(sDecData , "REQ_SEQ"));     //CP요청 번호 , main에서 생성한 값을 되돌려준다. 세션등에서 비교 가능
      var responsenumber = decodeURIComponent(GetValue(sDecData , "RES_SEQ"));    //고유 번호 , 나이스에서 생성한 값을 되돌려준다.
      var authtype = decodeURIComponent(GetValue(sDecData , "AUTH_TYPE"));        //인증수단
      var name = decodeURIComponent(GetValue(sDecData , "UTF8_NAME"));            //이름
      var birthdate = decodeURIComponent(GetValue(sDecData , "BIRTHDATE"));       //생년월일(YYYYMMDD)
      var gender = decodeURIComponent(GetValue(sDecData , "GENDER"));             //성별
      var nationalinfo = decodeURIComponent(GetValue(sDecData , "NATIONALINFO")); //내.외국인정보
      var dupinfo = decodeURIComponent(GetValue(sDecData , "DI"));                //중복가입값(64byte)
      var conninfo = decodeURIComponent(GetValue(sDecData , "CI"));               //연계정보 확인값(88byte)
      var mobileno = decodeURIComponent(GetValue(sDecData , "MOBILE_NO"));        //휴대폰번호(계약된 경우)
      var mobileco = decodeURIComponent(GetValue(sDecData , "MOBILE_CO"));        //통신사(계약된 경우)
    }
    console.log(sDecData);

    response.render("checkplus_success.ejs", {sRtnMSG , requestnumber , responsenumber , authtype , name , birthdate , gender , nationalinfo , dupinfo , conninfo , mobileno , mobileco});
  });

});

app.post("/checkplus_fail", function(request, response) {
  var sEncData = request.body.EncodeData;
  var cmd = "";

  if( /^0-9a-zA-Z+\/=/.test(sEncData) == true){
    sRtnMSG = "입력값 오류";
    requestnumber = "";
    authtype = "";
    errcode = "";
    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  }
  
  if(sEncData != "")
  {
     cmd = sModulePath + " " + "DEC" + " " + sSiteCode + " " + sSitePW + " " + sEncData;
  }

  var sDecData = "";

  var child = exec(cmd , {encoding: "euc-kr"});
  child.stdout.on("data", function(data) {
    sDecData += data;
  });
  child.on("close", function() {
    //console.log(sDecData);

    //처리 결과 메시지
    var sRtnMSG = "";
    //처리 결과 확인
    if (sDecData == "-1"){
      sRtnMSG = "암/복호화 시스템 오류";
    }
    else if (sDecData == "-4"){
      sRtnMSG = "복호화 처리 오류";
    }
    else if (sDecData == "-5"){
      sRtnMSG = "HASH값 불일치 - 복호화 데이터는 리턴됨";
    }
    else if (sDecData == "-6"){
      sRtnMSG = "복호화 데이터 오류";
    }
    else if (sDecData == "-9"){
      sRtnMSG = "입력값 오류";
    }
    else if (sDecData == "-12"){
      sRtnMSG = "사이트 비밀번호 오류";
    }
    else
    {
      //항목의 설명은 개발 가이드를 참조
      var requestnumber = decodeURIComponent(GetValue(sDecData , "REQ_SEQ"));     //CP요청 번호 , main에서 생성한 값을 되돌려준다. 세션등에서 비교 가능
      var authtype = decodeURIComponent(GetValue(sDecData , "AUTH_TYPE"));        //인증수단
      var errcode = decodeURIComponent(GetValue(sDecData , "ERR_CODE"));          //본인인증 실패 코드
    }

    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  });
});

app.get("/checkplus_fail", function(request, response) {
  //chrome80 대응
  var sEncData = request.param('EncodeData')
  var cmd = "";

  if( /^0-9a-zA-Z+\/=/.test(sEncData) == true){
    sRtnMSG = "입력값 오류";
    requestnumber = "";
    authtype = "";
    errcode = "";
    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  }
  
  if(sEncData != "")
  {
     cmd = sModulePath + " " + "DEC" + " " + sSiteCode + " " + sSitePW + " " + sEncData;
  }

  var sDecData = "";

  var child = exec(cmd , {encoding: "euc-kr"});
  child.stdout.on("data", function(data) {
    sDecData += data;
  });
  child.on("close", function() {
    //console.log(sDecData);

    //처리 결과 메시지
    var sRtnMSG = "";
    //처리 결과 확인
    if (sDecData == "-1"){
      sRtnMSG = "암/복호화 시스템 오류";
    }
    else if (sDecData == "-4"){
      sRtnMSG = "복호화 처리 오류";
    }
    else if (sDecData == "-5"){
      sRtnMSG = "HASH값 불일치 - 복호화 데이터는 리턴됨";
    }
    else if (sDecData == "-6"){
      sRtnMSG = "복호화 데이터 오류";
    }
    else if (sDecData == "-9"){
      sRtnMSG = "입력값 오류";
    }
    else if (sDecData == "-12"){
      sRtnMSG = "사이트 비밀번호 오류";
    }
    else
    {
      //항목의 설명은 개발 가이드를 참조
      var requestnumber = decodeURIComponent(GetValue(sDecData , "REQ_SEQ"));     //CP요청 번호 , main에서 생성한 값을 되돌려준다. 세션등에서 비교 가능
      var authtype = decodeURIComponent(GetValue(sDecData , "AUTH_TYPE"));        //인증수단
      var errcode = decodeURIComponent(GetValue(sDecData , "ERR_CODE"));          //본인인증 실패 코드
    }

    response.render("checkplus_fail.ejs", {sRtnMSG , requestnumber , authtype , errcode});
  });
});

function GetValue(plaindata , key){
  var arrData = plaindata.split(":");
  var value = "";
  for(i in arrData){
    var item = arrData[i];
    if(item.indexOf(key) == 0)
    {
      var valLen = parseInt(item.replace(key, ""));
      arrData[i++];
      value = arrData[i].substr(0 ,valLen);
      break;
    }
  }
  return value;
}

app.listen(port, function(err) {
  console.log("Connected port - " + port);
  if (err) {
    return console.log("Found error - ", err);
  }
});
