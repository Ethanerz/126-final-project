"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { browserClient } from "@/lib/supabase";
import { safeUrl } from "@/lib/catalog";
import {
  categories,
  type Place,
  type Review,
  type Submission,
} from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "./ui/field";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

function detailsText(
  value: Record<string, string> | null | undefined,
  singleKey: string,
) {
  if (!value) return "";
  if (Object.keys(value).length === 1 && singleKey in value)
    return value[singleKey];
  return Object.entries(value)
    .map(([label, text]) => `${label}: ${text}`)
    .join("\n");
}
function PlaceEditor({
  initial,
  onSaved,
}: {
  initial: Place | null;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    entity_type: initial?.entity_type || "facility",
    category: initial?.category || "Everyday essentials",
    campus: initial?.campus || "Miagao",
    address: initial?.address || "",
    latitude: initial?.latitude?.toString() || "",
    longitude: initial?.longitude?.toString() || "",
    preparation: initial?.preparation || "",
    source_url: initial?.source_url || "",
    source_checked_at: initial?.source_checked_at || "",
    hours: detailsText(initial?.operating_hours, "Schedule"),
    contact: detailsText(initial?.contact_info, "Contact"),
    aliases: initial?.aliases?.join(", ") || "",
  });
  function textField(
    name: keyof typeof form,
    label: string,
    multiline = false,
    required = false,
  ) {
    return (
      <Field>
        <FieldLabel htmlFor={`edit-${name}`}>{label}</FieldLabel>
        {multiline ? (
          <Textarea
            id={`edit-${name}`}
            rows={3}
            maxLength={2000}
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          />
        ) : (
          <Input
            id={`edit-${name}`}
            required={required}
            type={name === "source_checked_at" ? "date" : "text"}
            maxLength={name === "name" ? 120 : 1000}
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          />
        )}
      </Field>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!session) return;
        setError("");
        const lat = form.latitude.trim() ? Number(form.latitude) : null;
        const lng = form.longitude.trim() ? Number(form.longitude) : null;
        if (
          (lat === null) !== (lng === null) ||
          (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
          (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))
        ) {
          setError(
            "Provide both valid coordinates, or leave both empty for an unpinned place.",
          );
          return;
        }
        if (form.source_url && !safeUrl(form.source_url)) {
          setError("Use a complete HTTPS source link.");
          return;
        }
        if (
          form.source_checked_at &&
          (!form.source_url ||
            form.source_checked_at > new Date().toISOString().slice(0, 10))
        ) {
          setError(
            "A checked date needs a source and cannot be in the future.",
          );
          return;
        }
        if (!form.name.trim()) {
          setError("Add the place name.");
          return;
        }
        setBusy(true);
        try {
          const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            entity_type: form.entity_type,
            category: form.category,
            campus: form.campus,
            address: form.address.trim() || null,
            latitude: lat,
            longitude: lng,
            preparation: form.preparation.trim() || null,
            source_url: form.source_url.trim() || null,
            source_checked_at: form.source_checked_at || null,
            operating_hours: form.hours.trim()
              ? { Schedule: form.hours.trim() }
              : null,
            contact_info: form.contact.trim()
              ? { Contact: form.contact.trim() }
              : null,
            aliases: form.aliases
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
          };
          const db = browserClient();
          const { error } = initial
            ? await db
                .from("entities")
                .update(payload)
                .eq("id", initial.id)
                .select("id")
                .single()
            : await db
                .from("entities")
                .insert({ ...payload, admin_id: session.user.id })
                .select("id")
                .single();
          if (error) throw error;
          onSaved();
        } catch {
          setError("The place wasn’t saved. Check the details and try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <FieldGroup>
        {textField("name", "Place or service name", false, true)}
        {textField("description", "What is it for?", true)}
        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select
            value={form.entity_type}
            onValueChange={(v) =>
              setForm({ ...form, entity_type: v as "facility" | "service" })
            }
          >
            <SelectTrigger aria-label="Place type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger aria-label="Place category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.slice(1).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Campus</FieldLabel>
          <Select
            value={form.campus}
            onValueChange={(v) => setForm({ ...form, campus: v })}
          >
            <SelectTrigger aria-label="Campus">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Miagao">Miagao</SelectItem>
                <SelectItem value="Iloilo City">Iloilo City</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {textField("address", "Building / landmark / address")}
        {textField("latitude", "Latitude (optional)")}
        {textField("longitude", "Longitude (optional)")}
        {textField("preparation", "Before you go — sourced preparation", true)}
        {textField("hours", "Confirmed hours (leave blank if unknown)", true)}
        {textField("contact", "Public office contact", true)}
        {textField("source_url", "Official or reliable source URL")}
        {textField("source_checked_at", "Date you checked the source")}
        <FieldDescription>
          A source check is not an on-site inspection. Don’t invent fees, hours,
          requirements, accessibility, or a map pin.
        </FieldDescription>
        {textField("aliases", "Other names / search terms (comma separated)")}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : "Save place"}
        </Button>
      </FieldGroup>
    </form>
  );
}
function QueueItem({
  item,
  reportedReview,
  onChanged,
}: {
  item: Submission;
  reportedReview?: Review;
  onChanged: () => void;
}) {
  const [note, setNote] = useState(item.moderator_note || "");
  const [status, setStatus] = useState(item.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between gap-3">
          <CardTitle className="capitalize">
            {item.kind.replace("_", " ")}
          </CardTitle>
          <Badge variant="outline">{item.status}</Badge>
        </div>
        <CardDescription>
          {new Date(item.created_at).toLocaleDateString("en-PH")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="whitespace-pre-wrap text-sm leading-7">{item.details}</p>
        {reportedReview && (
          <blockquote className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs font-semibold">
              Reported experience ·{" "}
              {reportedReview.moderation_status || "published"}
            </p>
            <p className="mt-2 text-sm font-medium">{reportedReview.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {reportedReview.review_text}
            </p>
          </blockquote>
        )}
        {item.entity_id && (
          <Link
            href={`/places/${item.entity_id}`}
            className="text-sm text-primary"
          >
            Open related place →
          </Link>
        )}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`note-${item.id}`}>
              Moderator response (visible to submitter)
            </FieldLabel>
            <Textarea
              id={`note-${item.id}`}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Submission["status"])}
            >
              <SelectTrigger aria-label="Submission status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {["open", "reviewing", "resolved", "dismissed"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        {item.kind === "deletion" && (
          <p className="text-xs leading-6 text-muted-foreground">
            Account deletion requires the operator to verify the requester and
            complete deletion in Supabase Auth. Mark resolved only after
            completing it. Requesting account:{" "}
            <code className="break-all">{item.user_id}</code>.
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {notice && (
          <p role="status" className="body-copy">
            {notice}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            const { error } = await browserClient()
              .from("submissions")
              .update({ status, moderator_note: note.trim() || null })
              .eq("id", item.id)
              .select("id")
              .single();
            setBusy(false);
            if (error) setError("The response wasn’t saved.");
            else onChanged();
          }}
        >
          Save response
        </Button>
        {item.review_id && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error } = await browserClient()
                .from("reviews")
                .update({ moderation_status: "hidden" })
                .eq("id", item.review_id!)
                .select("id")
                .single();
              setBusy(false);
              if (error) setError("The review wasn’t hidden.");
              else {
                setError("");
                setNotice("The reported review is hidden from public view.");
                onChanged();
              }
            }}
          >
            Hide reported review
          </Button>
        )}
        {item.review_id && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const { error } = await browserClient()
                .from("reviews")
                .update({ moderation_status: "published" })
                .eq("id", item.review_id!)
                .select("id")
                .single();
              setBusy(false);
              if (error) setError("The review wasn’t restored.");
              else {
                setError("");
                setNotice("The reported review is public again.");
                onChanged();
              }
            }}
          >
            Restore reported review
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
export function Manage() {
  const { session, role, loading } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [items, setItems] = useState<Submission[]>([]);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<{ place: Place | null } | null>(null);
  const [revision, setRevision] = useState(0);
  const reviewMap = new Map(
    places.flatMap((p) => p.reviews || []).map((r) => [r.id, r]),
  );
  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    const db = browserClient();
    Promise.all([
      db.from("entities").select("*, reviews(*)").order("name").limit(200),
      db
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]).then(([p, s]) => {
      if (!active) return;
      if (p.error || s.error)
        setError("The management workspace couldn’t load. Please try again.");
      else {
        setPlaces(p.data as Place[]);
        setItems(s.data as Submission[]);
        setError("");
      }
    });
    return () => {
      active = false;
    };
  }, [role, revision]);
  if (loading || (session && role === null))
    return (
      <p role="status" className="body-copy">
        Checking editorial access…
      </p>
    );
  if (!session || role !== "admin")
    return (
      <>
        <h1 className="section-title">Editorial access required</h1>
        <p className="body-copy my-5">
          This workspace is for the campus guide’s moderators and catalog
          editors.
        </p>
        <Button asChild>
          <Link href="/account">Go to your account</Link>
        </Button>
      </>
    );
  return (
    <>
      <p className="eyebrow mb-3">Keep the guide useful</p>
      <h1 className="section-title">Campus guide workspace</h1>
      <p className="body-copy mb-7 mt-3">
        Check sources, keep unknowns honest, and respond to private reports.
      </p>
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">
            Inbox ({items.filter((i) => i.status === "open").length})
          </TabsTrigger>
          <TabsTrigger value="catalog">Catalog ({places.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {items.length ? (
              items.map((item) => (
                <QueueItem
                  key={item.id + item.status + (item.moderator_note || "")}
                  item={item}
                  reportedReview={
                    item.review_id ? reviewMap.get(item.review_id) : undefined
                  }
                  onChanged={() => setRevision((v) => v + 1)}
                />
              ))
            ) : (
              <p className="body-copy">
                No submissions yet. Corrections, suggestions, content reports
                and deletion requests appear here.
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="catalog" className="mt-5">
          <Button onClick={() => setEditor({ place: null })}>
            Add a place
          </Button>
          <div className="mt-5 flex flex-col gap-3">
            {places.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {p.name}{" "}
                    {p.archived_at && <Badge variant="outline">Archived</Badge>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.source_checked_at
                      ? `Source checked ${p.source_checked_at}`
                      : "Source check needed"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditor({ place: p })}
                  >
                    Edit details
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      const { error } = await browserClient()
                        .from("entities")
                        .update({
                          archived_at: p.archived_at
                            ? null
                            : new Date().toISOString(),
                        })
                        .eq("id", p.id)
                        .select("id")
                        .single();
                      if (error) setError("The archive state wasn’t updated.");
                      else setRevision((v) => v + 1);
                    }}
                  >
                    {p.archived_at ? "Restore" : "Archive"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!editor}
        onOpenChange={(v) => {
          if (!v) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editor?.place ? "Update place details" : "Add a campus place"}
            </DialogTitle>
            <DialogDescription>
              Keep facts sourced. Leave unconfirmed details blank.
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <PlaceEditor
              key={editor.place?.id || "new"}
              initial={editor.place}
              onSaved={() => {
                setEditor(null);
                setRevision((v) => v + 1);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
