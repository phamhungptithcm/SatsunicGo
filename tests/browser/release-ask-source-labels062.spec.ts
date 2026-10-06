/** Real local FAQ rendering only. No provider or command writes. */
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
test("ASK062 citation labels follow each answer across VI EN VI turns", async ({page},info) => {
  const unexpected: string[] = [];
  await denyUnsafeTraffic(page,unexpected);
  try {
    await page.goto("/support");
    expect(new URL(page.url()).origin).toBe("http://127.0.0.1:5187");
    await expect(page.getByRole("button",{name:/^Tài khoản của /})).toHaveCount(0);
    await readyVietnameseAsk(page);
    const dialog=page.getByRole("dialog",{name:"SatsunicGo",exact:true});
    const questions=["mua hộ hoạt động thế nào?","Answer in English: how does buying work?","Giải thích mua hộ hoạt động thế nào?"];
    for (const [index,question] of questions.entries()) {
      const input=page.getByRole("textbox",{name:/^(?:Hỏi|Ask) SatsunicGo$/}).filter({visible:true});
      await expect(input).toBeEnabled();
      await input.fill(question);
      await input.press("Enter");
      const turn=dialog.getByRole("region",{name:question,exact:true});
      const english=index===1;
      const heading=turn.getByRole("heading",{name:english?"From request to delivery":"Từ yêu cầu đến nhận hàng",exact:true});
      await expect(heading).toBeVisible();
      await expect(heading.locator("..")).toHaveAttribute("lang",english?"en":"vi");
      await expect(heading.locator("..")).toHaveCSS("opacity","1");
      const citation=turn.getByRole("link",{name:english?"How it works":"Cách hoạt động",exact:false});
      await expect(citation).toHaveAttribute("href","/how-it-works");
      await expect(turn.getByRole("link",{name:english?"Cách hoạt động":"How it works",exact:false})).toHaveCount(0);
      await expect(turn.getByRole("alert")).toHaveCount(0);
      if(index===1) {
        await expect(citation).toBeInViewport({ratio:1});
        await info.attach("english-source-label-render",{body:await page.screenshot(),contentType:"image/png"});
      }
    }
    // Earlier citations retain their own answer locale after later turns change it.
    await expect(dialog.getByRole("region",{name:questions[0],exact:true}).getByRole("link",{name:"Cách hoạt động",exact:false})).toHaveAttribute("href","/how-it-works");
    await expect(dialog.getByRole("region",{name:questions[1],exact:true}).getByRole("link",{name:"How it works",exact:false})).toHaveAttribute("href","/how-it-works");
    await expect(dialog.getByRole("region",{name:questions[2],exact:true}).getByRole("link",{name:"Cách hoạt động",exact:false})).toHaveAttribute("href","/how-it-works");
    await page.close();
    expect(unexpected).toEqual([]);
    await info.attach("actual-local-source-labels",{body:JSON.stringify({kind:"REAL_LOCAL_FAQ_LOCALE_CONTINUITY",languages:["vi","en","vi"],askCalls:0,commandCalls:0,realProvider:"NOT_RUN"}),contentType:"application/json"});
  } finally {
    if(!page.isClosed())await page.close();
  }
});
