import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <p className="text-muted-foreground">
        This product may have been removed or is no longer available.
      </p>
      <Button asChild>
        <Link href="/products">Browse all products</Link>
      </Button>
    </main>
  );
}
