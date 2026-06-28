"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { RequireAuth } from "@/components/auth/require-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/lib/checkout";
import { formatPHP } from "@/lib/utils";

export default function OrderSuccessPage() {
  return (
    <RequireAuth>
      <Confirmation />
    </RequireAuth>
  );
}

function Confirmation() {
  const params = useParams();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t find this order. It may belong to another account.
        </p>
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <CheckCircle2 className="size-9" />
        </motion.div>
        <h1 className="mt-5 text-3xl font-bold">Order placed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks for your order. We&apos;ll get it ready and deliver it soon.
        </p>
        <p className="mt-4 rounded-lg bg-elevated px-4 py-2 text-sm">
          Order number{" "}
          <span className="font-semibold text-foreground">
            {order.order_number}
          </span>
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0 truncate text-muted-foreground">
                {item.product_name}
                <span className="text-subtle"> × {item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums text-foreground">
                {formatPHP(item.line_total)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatPHP(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd className="tabular-nums">{formatPHP(order.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums text-primary">{formatPHP(order.total)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-muted-foreground">
          Payment: <span className="font-medium text-foreground">Cash on Delivery</span>
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
