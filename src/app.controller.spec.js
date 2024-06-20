import { Test } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let app;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe("Convert code to text", () => {
    it("should return a string of words with only words and spaces", () => {
      const appService = app.get(AppService);
      expect(appService.convertCodeToText("let {top, bottom, left, right} = Directions;")).toBe("let top bottom left right Directions");
    });

    it("should return a string of words with only words and spaces", () => {
      const appService = app.get(AppService);
      expect(appService.convertCodeToText(`<div className="mb-4 overflow-scroll font-sans"></div>`)).toBe("div class Name mb 4 overflow scroll font sans div");
    });
  });

  describe("getReadingTime test01", () => {
    it("should return 90,000ms", () => {
      const appService = app.get(AppService);
      const userWPM = 186;
      const articleBody =
        "연합뉴스 육군 제12사단에서 규정에 어긋난 군기 훈련(얼차려)을 받다 숨진 박모 훈련병의 수료식이 19일 열린 가운데 ‘상관이 시킨다고 무조건 듣지 말라’고 당부하는 입대 장병 부모가 늘고 있다. 아들을 고(故) 박 훈련병과 함께 입대했다고 밝힌 아버지 A씨는 최근 JTBC 유튜브 ‘뉴스들어가혁’과 인터뷰에서 “아들을 (수료식에서) 만나면 ‘그냥 시키는 것만 하고 나서지 말라’ ‘절대 건강하라’는 말을 해주고 싶다”면서 아들을 비롯해 군 복무하는 모든 장병에게 ‘너무 힘들면 영창에 갈 것을 각오하고라도 상관의 명령을 거부하라’는 취지로 발언했다. A씨는 “건강은 너희가 지켜야지 아무도 챙겨주지 않는다(는 말을 해주고 싶다)”면서 “입대할 때는 (군에 보낸 아들이) 대한민국의 군인이라고 그렇게 부모들에게 자랑하더니 무슨 사고만 터지면 ‘당신 아들’이라며 외면을 하니 누가 자식을 믿고 군에 보내겠느냐”고 목소리를 높였다. 고 박 훈련병 관련 소식을 전한 국민일보 뉴스에도 “5만 군 가족이 지켜보고 있다. 하루하루 애국심이 바닥으로 떨어진다” “멀쩡한 청년이 국방의 의무를 이행하러 갔다가 지휘관에 의해 고문당해 죽은 것이 이 사건의 본질이다” “군에 무늬만 군인인 국방 조무사로 가득하다. 뒤집어엎어야 한다” 등 군 당국을 비판하는 댓글이 잔뜩 달렸다. 한편 이날 고 박 훈련병의 어머니 B씨는 군인권센터를 통해 아들이 군기 훈련을 받은 상황과 쓰러진 뒤 군의 조치에 대해 문제를 제기했다. 그는 “군이 아들에게 씌운 프레임은 ‘떠들다 (규칙을 어겨) 얼차려를 받은 것’이었는데 아들이 동기들과 실제로 나눈 말은 ‘조교를 하면 아침에 일찍 일어나야겠다’와 같은 것들이었다”면서 “내 아들과 잔악한 선착순 달리기를 시키고 언제 끝날지 모르는 구보를 뛰게 하다 아들을 쓰러뜨린 중대장 중 누가 규칙을 더 많이 어겼느냐”고 지적했다. 강원경찰청 훈련병 사망 사건 수사 전담팀은 사건 발생 26일 만인 지난 18일 해당 중대장과 부중대장에게 직권남용가혹행위와 업무상과실치사 혐의를 적용해 검찰에 구속 영장을 신청했다. 김진욱 기자 reality@kmib.co.kr 경제부 김진욱 기자 reality@kmib.co.kr 응원하기 금융권 소식을 전합니다. GoodNews paper ⓒ 국민일보(www.kmib.co.kr), 무단전재, 수집, 재배포 및 AI학습 이용 금지 ";

      expect(appService.getReadingTime(articleBody, userWPM)).toBe(90000);
    });

    it("should return 60,000ms", () => {
      const appService = app.get(AppService);
      const userWPM = 202;
      const articleBody =
        "이국종 대전국군병원장. 뉴시스 이국종 대전국군병원장이 “이미 한국 필수의료는 초토화된 상태”라면서 의대 정원 확대로 필수의료 기피 문제를 해결하기 어렵다고 지적했다. 중증외상 분야 국내 최고 권위자인 이 병원장이 의대 증원에 대한 입장을 공식 석상에서 밝힌 건 처음이다. 이 병원장은 지난 19일 대전 유성구 국립중앙과학관에서 지역 교사들을 대상으로 열린 ‘명강연 콘서트’에서 “현재 의료계는 벌집이 터졌고 전문의는 더 이상 배출되지 않아 없어질 것”이라고 말했다. 그는 의대 정원 확대가 필수의료 의사 확보에 실질적인 효과를 거두기 어렵다고 지적했다. 이 병원장은 “30년 전과 비교해 소아과 전문의는 3배 늘었고 신생아는 4분의 1 수준으로 줄었지만 정작 부모들은 병원이 없어 ‘오픈런’을 한다”며 “이런 상황에서 의대생을 200만명 늘린다고 해서 소아과를 하겠느냐”고 말했다. 이 병원장은 “‘필수의료과가 망한다’는 말은 내가 의대생이던 30~40년 전부터 나왔다”면서 “정부 정책의 실패”라고 비판했다. 그는 “지금 의사가 부족하다고 하는데 내가 전문의를 취득한 1999년에는 의사가 너무 많아 해외로 수출해야 한다고 했다. 얼마 전까지는 미용으로 의료 관광을 육성한다고 하더니 이젠 필수의료를 살려야 한다고 한다”며 “하지만 이미 한국 필수의료는 초토화된 상태”라고 말했다. 이 병원장은 필수의료 시스템부터 다져야 한다고 강조했다. 그는 “해외에서 한국 같은 ‘응급실 뺑뺑이’는 상상도 할 수 없다”며 “미국은 환자가 병원에 도착하기도 전에 의사와 간호사가 대기하는 이런 시스템을 20년 전부터 갖췄다”고 말했다. 일본이 연간 1800번 닥터헬기를 띄운다면 한국은 미군 헬기까지 동원해도 출동 횟수가 300번이 채 되지 않는다는 지적이다. 그는 “앞으로 전문의가 배출되지 않아 사라질 것”이라며 “의료계가 몇 달째 머리를 맞대고 있어도 답이 나오지 않고 있지만 최선을 다할 것”이라고 덧붙였다. 정신영 기자 spirit@kmib.co.kr GoodNews paper ⓒ 국민일보(www.kmib.co.kr), 무단전재, 수집, 재배포 및 AI학습 이용 금지 ";

      expect(appService.getReadingTime(articleBody, userWPM)).toBe(60000);
    });
  });
});

