import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  askConversationSchema,
  redactChat,
} from "../../../packages/domain/ask-workflow";
import { activeKnowledge } from "../../../packages/domain/ask-knowledge";
import { knowledgeSource } from "./approved-knowledge";
import { retrieveKnowledge } from "./knowledge-retrieval";
import { revisionChunks } from "./knowledge-context";

const orderFacts = z
  .object({
    ownerId: z.string(),
    version: z.number().int().positive().safe(),
    stage: z.enum([
      "REQUESTED",
      "QUOTED",
      "QUOTE_ACCEPTED",
      "PURCHASING",
      "PURCHASED",
      "ORIGIN_RECEIVED",
      "PACKED",
      "READY_TO_SHIP",
      "IN_TRANSIT",
      "DELIVERED",
      "COMPLETED",
      "CANCELLED",
    ]),
    quoteVersion: z.number().int().nonnegative().safe().optional(),
    finalApproved: z.boolean().optional(),
  })
  .strip();
/** Allow-list projection: never send contacts, addresses, receipts, raw notes or arbitrary URLs. */
export function contextTask(value: unknown, uid: string) {
  const parsed = askConversationSchema.safeParse(value);
  if (!parsed.success || parsed.data.ownerId !== uid)
    throw Error("CONTEXT_OWNER_OR_VERSION");
  const c = parsed.data;
  return {
    version: c.version,
    orderId: c.orderId ?? null,
    pendingOperation: c.pendingOperation ?? null,
    recipientSaved: c.recipientSaved === true,
    draft: c.draft
      ? {
          market: c.draft.market ?? null,
          items:
            c.draft.items?.map((item) => ({
              name: redactChat(item.name),
              quantity: item.quantity,
              variant: redactChat(item.variant),
            })) ?? [],
        }
      : null,
  };
}
/** Coherent server context. The stamp is checked again after generation, before publishing. */
export async function readServerContext(
  uid: string,
  input: {
    conversationId?: string;
    orderId?: string;
    question: string;
    language: "vi" | "en";
  },
) {
  const db = getFirestore();
  return db.runTransaction(
    async (tx) => {
      const [user, access, c, approvals, products] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        input.conversationId
          ? tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`))
          : Promise.resolve(null),
        tx.get(
          db.collection("askKnowledge").where("active", "==", true).limit(21),
        ),
        tx.get(
          db
            .collection("products")
            .where("status", "==", "published")
            .limit(101),
        ),
      ]);
      if (
        user.data()?.locked ||
        access.data()?.locked ||
        access.data()?.active !== true ||
        !Array.isArray(access.data()?.roles) ||
        !access.data()!.roles.includes("OWNER")
      )
        throw new HttpsError(
          "permission-denied",
          "Không thể dùng thử Ask với tài khoản này.",
        );
      const task = c ? contextTask(c.data(), uid) : null;
      const conversation = c ? askConversationSchema.parse(c.data()) : null;
      const recentTurns =
        conversation?.turns.slice(-6).map((turn) =>
          JSON.stringify({
            question: redactChat(turn.question),
            answerTitle: redactChat(turn.answer.title),
          }),
        ) ?? null;
      if (input.orderId && (!task || task.orderId !== input.orderId))
        throw new HttpsError(
          "failed-precondition",
          "Đơn hàng chưa khớp với hội thoại đang mở.",
        );
      const order = task?.orderId
        ? await tx.get(db.doc(`orders/${task.orderId}`))
        : null;
      const currentOrder = order ? orderFacts.parse(order.data()) : null;
      if (currentOrder && currentOrder.ownerId !== uid)
        throw new HttpsError(
          "permission-denied",
          "Không thể đọc đơn hàng này.",
        );
      const now = Date.now(),
        rows = approvals.docs.flatMap((doc) => {
          const a = activeKnowledge(doc.data(), input.language, now);
          return a && doc.id === `${a.source}-${a.sourceId}`
            ? [{ key: doc.id, approval: a }]
            : [];
        });
      const publications = await Promise.all(
        rows.map(({ approval }) =>
          tx.get(db.doc(`${approval.source}/${approval.sourceId}`)),
        ),
      );
      const documents = rows.flatMap(({ approval }, index) => {
        const source = knowledgeSource(publications[index].data());
        return source && source.hash === approval.contentHash
          ? [{ ...source.document, revision: source.hash }]
          : [];
      });
      const excerpts = retrieveKnowledge(
        documents,
        redactChat(input.question),
        8,
      );
      const evidence = excerpts.flatMap((excerpt) => {
        const document = documents.find((doc) => doc.id === excerpt.id)!;
        return revisionChunks(document)
          .filter((chunk) => chunk.text === excerpt.text)
          .slice(0, 1);
      });
      const catalog = products.docs.slice(0, 100).map((doc) => ({
        title:
          typeof doc.data().title === "string"
            ? (doc.data().title.slice(0, 160) as string)
            : "",
        brand:
          typeof doc.data().brand === "string"
            ? (doc.data().brand.slice(0, 80) as string)
            : "",
        orderable: doc.data().orderable === true,
      }));
      const stamp = createHash("sha256")
        .update(
          JSON.stringify({
            task,
            recentTurns,
            order: currentOrder,
            approvals: approvals.docs.map((doc) => [
              doc.id,
              doc.updateTime?.toMillis(),
            ]),
            sources: publications.map((doc) => [
              doc.id,
              doc.updateTime?.toMillis(),
            ]),
            documents: documents.map((doc) => [doc.id, doc.revision]),
            products: products.docs.map((doc) => [
              doc.id,
              doc.updateTime?.toMillis(),
            ]),
          }),
        )
        .digest("hex");
      return {
        task,
        recentTurns,
        currentFacts: {
          order: currentOrder
            ? {
                version: currentOrder.version,
                stage: currentOrder.stage,
                quoteVersion: currentOrder.quoteVersion ?? null,
                finalApproved: currentOrder.finalApproved ?? null,
              }
            : null,
          catalog,
          completeCatalog: products.size <= 100,
          knowledgeCoverageLimited: approvals.size > 20,
        },
        evidence,
        stamp,
      };
    },
    { readOnly: true },
  );
}
