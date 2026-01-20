"use client"

import { useId } from "react"
import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  UniqueIdentifier 
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheckFilled,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconAlertCircle,
  IconBrandWhatsapp,
  IconClock
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { Loader2, Save, X, Pencil, User } from "lucide-react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils" // Ensure you have this helper
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// Ensure these imports match your project structure
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// 👇 1. ADD THIS IMPORT
import { UploadButton } from "@/lib/uploadthing"

// Import your server action
import { updateMember } from "@/app/(dashboard)/dashboard/clients/update_member_actions"

// --- TYPES ---
export type Member = {
  id: number
  fullName: string
  email: string | null
  whatsapp: string
  status: string 
  planName: string | null
  endDate: Date
  createdAt: Date
  photoUrl: string | null
  gymId: number
  biometricId: string | null
  planId: string 
  dob: Date | null
}

// --- DRAG HANDLE ---
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab active:cursor-grabbing"
    >
      <IconGripVertical className="size-4" />
    </Button>
  )
}

// --- COLUMNS ---
export const getColumns = (
  plans: any[], 
  onMemberClick: (member: Member) => void 
) : ColumnDef<Member>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id.toString()} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "photoUrl",
    header: "", 
    cell: ({ row }) => (
      <Avatar className="h-9 w-9 cursor-pointer" onClick={() => onMemberClick(row.original)}>
        <AvatarImage src={row.original.photoUrl || ""} alt={row.original.fullName} />
        <AvatarFallback>{row.original.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    ),
  },
  {
    accessorKey: "fullName",
    header: "Name",
    cell: ({ row }) => (
      <div 
        onClick={() => onMemberClick(row.original)}
        className="font-medium cursor-pointer hover:text-primary hover:underline transition-all"
      >
        {row.original.fullName}
      </div>
    ),
  },
  {
    accessorKey: "whatsapp",
    header: "WhatsApp",
    cell: ({ row }) => (
       <div className="flex items-center gap-2">
         <IconBrandWhatsapp className="size-4 text-green-500" />
         <span className="font-mono text-xs">{row.original.whatsapp}</span>
       </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge 
          variant="outline" 
          className={`px-2 py-0.5 ${
            row.original.status === 'ACTIVE' ? 'border-green-500 text-green-500' : 
            row.original.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : 
            'border-red-500 text-red-500'
          }`}
        >
        {row.original.status === 'ACTIVE' ? (
            <IconCircleCheckFilled className="size-3 mr-1" />
          ) : row.original.status === 'PENDING' ? (
            <IconClock className="size-3 mr-1" />
          ) : (
            <IconAlertCircle className="size-3 mr-1" />
          )}
          {row.original.status}
        </Badge>
    ),
  },
  {
    accessorKey: "endDate",
    header: "Expiry",
    cell: ({ row }) => {
      const date = new Date(row.original.endDate);
      const formatted = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
      return <div className="text-sm">{formatted}</div>;
    },
  },
]

// --- DRAGGABLE ROW ---
function DraggableRow({ row }: { row: Row<Member> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 bg-background"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// --- MAIN DATATABLE COMPONENT ---
export function DataTable({ data: initialData, plans }: { data: Member[], plans: any[] }) {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null)
  
  const [data, setData] = React.useState(initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })

  const columns = React.useMemo(
    () => getColumns(plans, (member) => setSelectedMember(member)), 
    [plans]
  )
  
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination },
    getRowId: (row) => row.id.toString(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = data.findIndex((item) => item.id === active.id)
        const newIndex = data.findIndex((item) => item.id === over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
      toast.success("Row reordered (Visual Only)")
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
            <Input placeholder="Filter members..." className="h-8 w-[150px] lg:w-[250px]" />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 size-4" /> Columns <IconChevronDown className="ml-2 size-4" />
            </Button>
            <Button size="sm" onClick={() => router.push("/dashboard/clients/add_client")}>
                <IconPlus className="mr-2 size-4" /> Add Member
            </Button>
        </div>
      </div>

      <div className="rounded-lg border mx-4 lg:mx-6 overflow-hidden">
        <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
        >
            <Table>
                <TableHeader className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                        ))}
                    </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                    <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                        {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                        ))}
                    </SortableContext>
                    ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                        No members found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="text-sm text-muted-foreground">
             {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <IconChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <IconChevronRight className="size-4" />
            </Button>
          </div>
      </div>

      <MemberDrawer 
        item={selectedMember} 
        plans={plans}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      />
    </div>
  )
}

// --- MEMBER DRAWER COMPONENT ---
function MemberDrawer({ 
  item, 
  plans, 
  open, 
  onOpenChange 
}: { 
  item: Member | null, 
  plans: any[], 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const isMobile = useIsMobile()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dob, setDob] = useState<Date | undefined>(undefined)
  // State for the photo URL
  const [photoUrl, setPhotoUrl] = useState("")

  React.useEffect(() => {
    if (item) {
        setPhotoUrl(item.photoUrl || "")
        setDob(item.dob ? new Date(item.dob) : undefined)
    }
  }, [item])

  if (!item) return null;

  return (
    <Drawer 
      open={open} 
      onOpenChange={(isOpen) => {
         if (!isOpen) setIsEditing(false);
         onOpenChange(isOpen);
      }} 
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="h-[90vh] sm:h-full sm:w-[450px] sm:ml-auto rounded-none border-l shadow-2xl">
         <form action={(formData) => {
            startTransition(async () => {
                const result = await updateMember(item.id, formData);
                if (result.success) {
                    toast.success("Profile updated");
                    setIsEditing(false);
                } else {
                    toast.error("Failed to update");
                }
            });
         }} className="flex flex-col h-full">
        
        {/* 👇 HEADER SECTION (With Avatar) */}
        <DrawerHeader className="border-b px-6 py-4 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
                {/* Show Avatar when NOT editing. When editing, we show the large uploader below. */}
                {!isEditing && (
                  <Avatar className="h-12 w-12 border shadow-sm">
                    <AvatarImage src={photoUrl} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {item.fullName.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div>
                    {isEditing ? (
                        <Input name="fullName" defaultValue={item.fullName} className="text-xl font-bold h-9 px-2 -ml-2 w-full" required />
                    ) : (
                        <DrawerTitle className="text-2xl font-bold">{item.fullName}</DrawerTitle>
                    )}
                    <DrawerDescription>Member Details</DrawerDescription>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isEditing && (
                    <Button size="sm" variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                )}
                <DrawerClose asChild>
                    <Button variant="ghost" size="icon"><X className="h-4 w-4" /></Button>
                </DrawerClose>
            </div>
        </DrawerHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* 👇 PHOTO UPLOAD SECTION (Only visible when Editing) */}
            {isEditing && (
                <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/10 transition-all">
                        {photoUrl ? (
                        <div className="relative group">
                            <img src={photoUrl} alt="Preview" className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md" />
                            <button
                                type="button"
                                onClick={() => setPhotoUrl("")} // Clear photo
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                        ) : (
                        <div className="text-center transform scale-90 origin-top">
                            <UploadButton
                                endpoint="clientImage"
                                onClientUploadComplete={(res) => {
                                    if (res?.[0]) setPhotoUrl(res[0].ufsUrl);
                                }}
                                onUploadError={(error: Error) => {
                                    toast.error("Upload failed");
                                }}
                                appearance={{
                                    button: "bg-primary text-primary-foreground hover:bg-primary/90"
                                }}
                            />
                            <p className="text-xs text-muted-foreground mt-2">Update Profile Picture</p>
                        </div>
                        )}
                        {/* Hidden Input to send data to server */}
                        <input type="hidden" name="photoUrl" value={photoUrl} />
                </div>
            )}

            {/* Status & Plan Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${isEditing ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Status</div>
                    {isEditing ? (
                        <Select name="status" defaultValue={item.status}>
                            <SelectTrigger className="h-8 bg-transparent border-transparent px-0 font-bold text-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="text-lg font-bold">{item.status}</div>
                    )}
                </div>
                <div className={`p-4 rounded-lg border ${isEditing ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'}`}>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Plan</div>
                    {isEditing ? (
                        <Select name="planId" defaultValue={item.planId || ""}>
                            <SelectTrigger className="h-8 bg-transparent border-transparent px-0 font-bold text-lg"><SelectValue placeholder="Select Plan" /></SelectTrigger>
                            <SelectContent>
                                {plans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id.toString()}>{plan.name} ({plan.duration} Days)</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="text-lg font-bold">{item.planName || "No Plan"}</div>
                    )}
                </div>
            </div>

            <div className="space-y-4 border-b pb-6">
            <h4 className="font-semibold text-sm text-muted-foreground">Personal Details</h4>
            
            <div className="grid gap-3">
                <Label>Date of Birth</Label>
                {isEditing ? (
                    <div className="relative">
                        {/* Hidden Input to send data to server */}
                        <input type="hidden" name="dob" value={dob ? dob.toISOString() : ""} />
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dob && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={dob}
                                    onSelect={setDob}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                    captionLayout="dropdown" 
                                    fromYear={1960} 
                                    toYear={new Date().getFullYear()}
                                    classNames={{
                                        caption_dropdowns: "flex justify-center gap-1",
                                        caption_label: "hidden",
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                ) : (
                    // VIEW MODE
                    <div className="flex items-center gap-3 text-sm p-2 rounded-md bg-muted/20">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        {item.dob ? format(new Date(item.dob), "PPP") : "Not provided"}
                    </div>
                )}
            </div>
        </div>

            <div className="space-y-6">
                <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">Contact Information</h4>
                <div className="grid gap-3">
                    <Label>WhatsApp</Label>
                    {isEditing ? (
                        <Input name="whatsapp" defaultValue={item.whatsapp} />
                    ) : (
                        <div className="flex items-center gap-3 text-sm p-2 rounded-md bg-muted/20">
                            <IconBrandWhatsapp className="size-4 text-green-600" />
                            <span className="font-mono">{item.whatsapp}</span>
                        </div>
                    )}
                </div>
                <div className="grid gap-3">
                     <Label>Email</Label>
                     {isEditing ? (
                       <Input name="email" defaultValue={item.email || ""} />
                     ) : (
                       <div className="flex items-center gap-3 text-sm p-2 rounded-md bg-muted/20">
                           <User className="size-4" />
                           {item.email || "No email"}
                       </div>
                     )}
                 </div>
                 <div className="grid gap-3">
                     <Label>Biometric ID</Label>
                     <Input name="biometricId" defaultValue={item.biometricId || ""} disabled={!isEditing} />
                 </div>
            </div>
        </div>

        <DrawerFooter className="border-t bg-muted/10 p-6">
            {isEditing ? (
                <Button type="submit" disabled={isPending} className="w-full">
                    {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                </Button>
            ) : (
                <Button type="button" className="w-full" onClick={(e) => { e.preventDefault(); setIsEditing(true); }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            )}
        </DrawerFooter>
     </form>
      </DrawerContent>
    </Drawer>
  )
}