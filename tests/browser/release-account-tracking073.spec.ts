import { test, expect } from '@playwright/test';
import { OwnedAskFixture } from './ask-integration-owned049';
import { closeFixtures } from './fixtures';
test.afterAll(closeFixtures);
test('ACCOUNT073 own order filters and shared timeline', async ({page}, info) => {
  const fixture=new OwnedAskFixture();
  let setupSettled=false;
  const setup=fixture.setup().finally(()=>{setupSettled=true;});
  fixture.registerDrain(async()=>{
    if(!setupSettled){fixture.preserve();throw Error('SETUP_NOT_SETTLED');}
  });
  try {
    await setup;
    await fixture.login(page);
    await page.goto('/account?filter=undelivered');
    await expect(page.getByRole('navigation',{name:'Lọc đơn hàng'})).toBeVisible();
    const detail=page.locator(`a[href="/account/orders/${fixture.orderId}"]`);
    await expect(detail).toBeVisible();
    await detail.click();
    const tracking=page.getByRole('region',{name:'Theo dõi đơn hàng',exact:true});
    await expect(tracking).toBeVisible();
    await expect(tracking.locator('code').first()).toHaveText(fixture.orderId);
    await expect(tracking.getByRole('list',{name:'Các bước xử lý'})).toBeVisible();
    await expect(tracking.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(tracking.getByText('Chưa có thời gian giao dự kiến được xác nhận.',{exact:true})).toBeVisible();
    for(const group of ['delivered','cancelled']) {
      await page.goto(`/account?filter=${group}`);
      await expect(page.locator(`a[href="/account/orders/${fixture.orderId}"]`)).toHaveCount(0);
      await expect(page.getByRole('heading',{name:'Không có đơn trong nhóm này'})).toBeVisible();
      await expect(page.getByRole('link',{name:'Xem tất cả đơn',exact:true})).toBeVisible();
    }
    await info.attach('account-tracking073',{body:await page.screenshot(),contentType:'image/png'});
  } finally {
    await page.close();
    const receipt=await fixture.cleanup();
    await info.attach('owned-cleanup',{body:JSON.stringify(receipt),contentType:'application/json'});
    expect(receipt.status).toBe('PASSED');
  }
});
