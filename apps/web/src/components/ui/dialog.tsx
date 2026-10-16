import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) { return <DialogPrimitive.Root data-slot="dialog" {...props} />; }
function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) { return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />; }
function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) { return <DialogPrimitive.Close data-slot="dialog-close" {...props} />; }
function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) { return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]"/><DialogPrimitive.Content data-slot="dialog-content" className={cn("fixed left-1/2 top-1/2 z-50 grid max-h-[80vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border bg-card p-6 shadow-xl", className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 cursor-pointer rounded-sm text-muted-foreground hover:text-foreground"><X className="size-4"/><span className="sr-only">关闭</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>; }
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)} {...props} />; }
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("text-lg leading-none font-semibold", className)} {...props} />; }
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />; }
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />; }

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
