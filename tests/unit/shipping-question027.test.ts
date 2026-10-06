import { expect,test } from "vitest";
import {shippingQuestionDirection,questionWeightKg} from "../../src/features/ask/ShippingQuote";
test("recognizes both directions and preserves weight units",()=>{expect(shippingQuestionDirection("giá gửi hàng từ mỹ về việt nam")).toBe("US_VN");expect(shippingQuestionDirection("shipping from Vietnam to US 1kg")).toBe("VN_US");expect(questionWeightKg("gửi 1,5 kg")).toBe("1.5");expect(questionWeightKg("ship 250g")).toBe("0.25");});
test("does not assume a direction or weight without supplied input",()=>{expect(shippingQuestionDirection("bao nhiêu tiền gửi hàng?")).toBeNull();expect(questionWeightKg("gửi Mỹ")).toBe("");expect(questionWeightKg("ship -1kg")).toBe("");});
