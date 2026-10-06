/** DECLARED browser rendering fault. No real quota exhaustion or provider invocation is proved. */
import { test, expect } from "@playwright/test";
import { closeFixtures } from "./fixtures";

async function denyUnsafeTraffic(page: import("@playwright/test").Page, unexpected: string[]) {
    // Public emulator reads may proceed; command/provider writes are denied before dispatch.
    await page.route("**/*", async (route) => {
      const request = route.request(), url = new URL(request.url());
      const local = ["http://127.0.0.1:5187", "http://127.0.0.1:8187"].includes(url.origin);
      const write = !["GET", "HEAD", "OPTIONS"].includes(request.method());
      const firestoreRead = url.origin === "http://127.0.0.1:8187" &&
        /\/google\.firestore\.v1\.Firestore\/Listen\/channel$/.test(url.pathname) &&
        url.searchParams.get("database") === "projects/demo-satsunicgo/databases/(default)";
      if (!local || (write && !firestoreRead)) {
        unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });
}

async function readyVietnameseAsk(page: import("@playwright/test").Page) {
  const input = page.getByRole("textbox", { name: "Hỏi SatsunicGo", exact: true }).filter({ visible: true });
  const launcher = page.getByRole("button", { name: "Hỏi SatsunicGo", exact: true }).filter({ visible: true });
  // Wait for actual hydrated UI before choosing between composer and launcher.
  await expect(input.or(launcher).first()).toBeVisible();
  if (!(await input.isVisible())) await launcher.click();
  await expect(input).toBeEnabled();
  return input;
}

test.afterAll(closeFixtures);
for (const language of ["vi", "en"] as const)
  test(`ASK055 ${language} declared RESOURCE_EXHAUSTED renders neutral recovery without timing guarantee`, async ({page},info) => {
    const attempts: Array<{endpoint:string;question:string;status:number}> = [];
    const unexpected: string[] = [];
    const question = language === "vi"
      ? "Em có thể so sánh hai phương án mua hàng quốc tế theo ngân sách không?"
      : "Can you compare two international purchase options for my household?";
    const expected = language === "vi"
      ? "Chưa thể trả lời lúc này. Hãy thử lại sau."
      : "We can’t answer right now. Please try again later.";
    const requestListener = (request: import("@playwright/test").Request) => {
      const url = new URL(request.url());
      if(request.method()==="POST" && url.origin==="http://127.0.0.1:5107" &&
          url.pathname !== "/demo-satsunicgo/asia-southeast1/ask") unexpected.push(url.pathname);
    };
    page.on("request",requestListener);
    await denyUnsafeTraffic(page, unexpected);
    await page.route("**/ask", async(route) => {
      const request=route.request(),url=new URL(request.url());
      expect(url.origin).toBe("http://127.0.0.1:5107");
      expect(url.pathname).toBe("/demo-satsunicgo/asia-southeast1/ask");
      if(request.method()==="OPTIONS"){await route.continue();return;}
      if(request.method()!=="POST") {
        unexpected.push(`${request.method()} ${url.origin}${url.pathname}`);
        await route.abort("blockedbyclient");
        return;
      }
      const body=request.postDataJSON();
      expect(body.data.question).toBe(question);
      expect(body.data.language).toBe(language);
      attempts.push({endpoint:"ask",question:body.data.question,status:200});
      // No route.fetch or upstream POST: this is solely a declared error-rendering fixture.
      await route.fulfill({status:200,contentType:"text/event-stream",body:`data: ${JSON.stringify({
        error:{status:"RESOURCE_EXHAUSTED",message:"Declared rendering fault; no upstream quota/provider execution."},
      })}\n\n`});
    });
    try {
      await page.goto("/support");
      expect(new URL(page.url()).origin).toBe("http://127.0.0.1:5187");
      await expect(page.getByRole("button",{name:/^Tài khoản của /})).toHaveCount(0);
      const initial=await readyVietnameseAsk(page);
      const input=()=>page.getByRole("textbox",{name:language==="vi"?"Hỏi SatsunicGo":"Ask SatsunicGo",exact:true}).filter({visible:true});
      if(language==="en") {
        await initial.fill("Answer in English: how does buying work?");
        await initial.press("Enter");
        await expect(page.getByRole("heading",{name:"From request to delivery",exact:true})).toBeVisible();
        expect(attempts).toHaveLength(0);
      }
      await expect(input()).toBeEnabled();
      await input().fill(question);
      await input().press("Enter");
      const dialog=page.getByRole("dialog",{name:"SatsunicGo",exact:true});
      const turn=dialog.getByRole("region",{name:question,exact:true});
      await expect(turn.getByRole("alert")).toContainText(expected);
      await expect(turn.getByRole("alert")).not.toContainText(/một phút|one minute|many questions|nhiều câu/i);
      await expect(turn.getByRole("button",{name:language==="vi"?"Thử lại":"Try again",exact:true})).toBeEnabled();
      await expect(turn.getByRole("link",{name:language==="vi"?"Gửi yêu cầu mua hộ":"Request an item",exact:false})).toHaveAttribute("href","/request");
      await expect(input()).toHaveValue(question);
      expect(attempts).toHaveLength(1);
      expect(unexpected).toEqual([]);
      await info.attach("declared-quota-rendering-fault",{body:JSON.stringify({
        kind:"DECLARED_SSE_RENDERING_FAULT",realQuotaExhaustion:"NOT_RUN",realProvider:"NOT_RUN",upstreamAskPosts:0,attempts,
      }),contentType:"application/json"});
      await expect(turn.getByRole("alert")).toHaveCSS("opacity","1");
      await expect(turn.getByRole("alert")).toBeInViewport({ratio:1});
      await info.attach("quota-error-render",{body:await page.screenshot(),contentType:"image/png"});
      await page.close();
      expect(unexpected).toEqual([]);
    } finally {
      if(!page.isClosed())await page.close();
      page.off("request",requestListener);
    }
  });

for (const language of ["vi", "en"] as const)
  test(`ASK055 ${language} two-goal clarification describes optional lookup fields without requiring three goals`, async ({page},info) => {
    const unexpected: string[] = [];
    const question = language === "vi"
      ? "tìm vitamin, giải thích lựa chọn phù hợp"
      : "find vitamin, explain suitable options";
    const expected = language === "vi"
      ? "Nêu rõ từng thông tin cần tra cứu: mã đơn, sản phẩm hoặc chiều gửi hàng. Gửi thao tác mua, thanh toán hoặc xác nhận thành yêu cầu riêng."
      : "Specify each lookup: an order ID, product or shipping direction. Send purchases, payments or confirmations as a separate request.";
    await denyUnsafeTraffic(page, unexpected);
    try {
      await page.goto("/support");
      expect(new URL(page.url()).origin).toBe("http://127.0.0.1:5187");
      await expect(page.getByRole("button",{name:/^Tài khoản của /})).toHaveCount(0);
      const initial=await readyVietnameseAsk(page);
      if (language === "en") {
        await initial.fill("Answer in English: how does buying work?");
        await initial.press("Enter");
        await expect(page.getByRole("heading",{name:"From request to delivery",exact:true})).toBeVisible();
      }
      const input=page.getByRole("textbox",{name:language==="vi"?"Hỏi SatsunicGo":"Ask SatsunicGo",exact:true}).filter({visible:true});
      await expect(input).toBeEnabled();
      await input.fill(question);
      await input.press("Enter");
      const dialog=page.getByRole("dialog",{name:"SatsunicGo",exact:true});
      const turn=dialog.getByRole("region",{name:question,exact:true});
      await expect(turn.getByRole("heading",{name:language==="vi"?"Làm rõ yêu cầu":"Clarify your request",exact:true})).toBeVisible();
      await expect(turn).toContainText(expected);
      await expect(turn.getByRole("alert")).toHaveCount(0);
      await expect(input).toBeEnabled();
      expect(unexpected).toEqual([]);
      await info.attach("actual-local-clarification",{body:JSON.stringify({kind:"REAL_LOCAL_TWO_GOAL_CLARIFICATION",question,language,askCalls:0,commandCalls:0,realProvider:"NOT_RUN"}),contentType:"application/json"});
      const heading=turn.getByRole("heading",{name:language==="vi"?"Làm rõ yêu cầu":"Clarify your request",exact:true});
      await expect(heading.locator("..")).toHaveCSS("opacity","1");
      await expect(heading).toBeInViewport({ratio:1});
      await expect(turn.getByText(expected,{exact:true})).toBeInViewport({ratio:1});
      await info.attach("clarification-render",{body:await page.screenshot(),contentType:"image/png"});
      await page.close();
      expect(unexpected).toEqual([]);
    } finally {
      if(!page.isClosed())await page.close();
    }
  });
