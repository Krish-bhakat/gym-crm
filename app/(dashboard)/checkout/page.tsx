"use client";
import { searchMembers, type MemberResult } from "@/app/(dashboard)/checkout/get_member";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Minus, Plus, Trash, User, Users } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import z from "zod";

// 👇 CHECK THIS PATH: Import your Zustand store
import { useProductStore } from "@/app/(dashboard)/dashboard/(inventory)/products/store";

import { cn } from "@/lib/utils";

// UI Imports
import {
  Logo,
  LogoImageDesktop,
  LogoImageMobile,
} from "@/components/shadcnblocks/logo";
import { Price, PriceValue } from "@/components/shadcnblocks/price";
import QuantityInput from "@/components/shadcnblocks/quantity-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- MOCK DATA FOR MEMBERS ---
const GYM_MEMBERS = [
  { id: "mem_001", name: "John Doe", email: "john@gym.com" },
  { id: "mem_002", name: "Sarah Smith", email: "sarah@gym.com" },
  { id: "mem_003", name: "Mike Tyson", email: "mike@gym.com" },
  { id: "mem_004", name: "Alice Wonderland", email: "alice@gym.com" },
  { id: "mem_005", name: "Bob Builder", email: "bob@gym.com" },
];

// --- Types ---
interface ProductPrice {
  regular: number;
  sale?: number;
  currency: string;
}

type CheckoutCartItem = {
  product_id: number; // Matches Store ID type
  link: string;
  name: string;
  image: string;
  price: ProductPrice;
  quantity: number;
  details: {
    label: string;
    value: string;
  }[];
};

interface CartItemProps extends CheckoutCartItem {
  index: number;
  onRemoveClick: () => void;
  onQuantityChange: (newQty: number) => void;
}

interface CartProps {
  cartItems: CheckoutCartItem[];
  form: UseFormReturn<CheckoutFormType>;
}

interface ExtendedCartProps extends CartProps {
  onStoreRemove: (id: number) => void;
  onStoreUpdate: (id: number, qty: number) => void;
}

// --- Payment & Schema Definitions ---
const PAYMENT_METHODS = {
  creditCard: "creditCard",
  paypal: "paypal",
  onlineBankTransfer: "onlineBankTransfer",
  onAccount: "onAccount",
};

type PaymentMethod = keyof typeof PAYMENT_METHODS;

// 1. Payment Sub-Schemas
const CreditCardPayment = z.object({
  method: z.literal(PAYMENT_METHODS.creditCard),
  cardholderName: z.string(),
  cardNumber: z.string(),
  expiryDate: z.string(),
  cvc: z.string(),
});

const PayPalPayment = z.object({
  method: z.literal(PAYMENT_METHODS.paypal),
  payPalEmail: z.string(),
});

const BankTransferPayment = z.object({
  method: z.literal(PAYMENT_METHODS.onlineBankTransfer),
  bankName: z.string(),
  accountNumber: z.string(),
});

const OnAccountPayment = z.object({
  method: z.literal(PAYMENT_METHODS.onAccount),
});

const PaymentSchema = z.discriminatedUnion("method", [
  CreditCardPayment,
  PayPalPayment,
  BankTransferPayment,
  OnAccountPayment,
]);

const ProductSchema = z.object({
  product_id: z.number(),
  quantity: z.number(),
  price: z.number(),
});

// 2. Guest vs Member Schema Strategy
const GuestSchema = z.object({
  checkoutMode: z.literal("guest"),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    subscribe: z.boolean().optional(),
  }),
  address: z.object({
    country: z.string().min(1, "Country is required"),
    firstName: z.string().min(1, "First Name is required"),
    lastName: z.string().min(1, "Last Name is required"),
    address: z.string().min(1, "Address is required"),
    postalCode: z.string().min(1, "Postal Code is required"),
    city: z.string().min(1, "City is required"),
    phone: z.string().min(1, "Phone is required"),
  }),
  // Guest cannot use "On Account"
  payment: z.discriminatedUnion("method", [
    CreditCardPayment,
    PayPalPayment,
    BankTransferPayment,
  ]),
  products: z.array(ProductSchema),
});

const MemberSchema = z.object({
  checkoutMode: z.literal("member"),
  memberId: z.string().min(1, "Please select a member"),
  // Members can use any payment method including "On Account"
  payment: PaymentSchema,
  products: z.array(ProductSchema),
});

// Combine into one Union Schema
const checkoutFormSchema = z.discriminatedUnion("checkoutMode", [
  GuestSchema,
  MemberSchema,
]);

type CheckoutFormType = z.infer<typeof checkoutFormSchema>;

// --- Main Component ---
const CheckoutPage = ({ className }: { className?: string }) => {
  const [activeAccordion, setActiveAccordion] = useState("section-1");
  const { cart, updateQuantity, removeFromCart } = useProductStore();

  // Map Store Data to Checkout Data
  const mappedCartItems: CheckoutCartItem[] = useMemo(() => {
    return cart.map((item: any) => ({
      product_id: item.id,
      name: item.title,
      image: item.image,
      quantity: item.quantity,
      price: {
        regular: item.price,
        currency: "USD",
      },
      link: "#",
      details: [],
    }));
  }, [cart]);

  const form = useForm<CheckoutFormType>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      checkoutMode: "guest",
      payment: {
        method: PAYMENT_METHODS.creditCard,
      },
      products: [],
    },
  });

  const checkoutMode = form.watch("checkoutMode");

  // Sync Cart Data
  useEffect(() => {
    if (mappedCartItems.length > 0) {
      const formProducts = mappedCartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price.sale ?? item.price.regular,
      }));

      const currentValues = form.getValues();
      // Safe check to prevent infinite loops
      // @ts-ignore - union type complexity check
      if (JSON.stringify(currentValues.products) !== JSON.stringify(formProducts)) {
        form.reset({
          ...currentValues,
          products: formProducts,
        });
      }
    }
  }, [mappedCartItems, form]);

  const onSubmit = (data: CheckoutFormType) => {
    if (data.checkoutMode === "member") {
      console.log("PROCESSING MEMBER ORDER");
      console.log("Member ID:", data.memberId);
      console.log("Payment:", data.payment);
      console.log("Items:", data.products);
      // Logic: Invoice the member
    } else {
      console.log("PROCESSING GUEST ORDER");
      console.log("Details:", data.contactInfo);
      console.log("Address:", data.address);
      // Logic: Standard checkout
    }
  };

  const onContinue = (value: string) => {
    setActiveAccordion(value);
  };

  const handleOnValueChange = (value: string) => {
    setActiveAccordion(value);
  };

  const handleCheckoutQuantityChange = (id: number, qty: number) => {
    const item = cart.find((i: any) => i.id === id);
    if (item) {
      const diff = qty - item.quantity;
      if (diff !== 0) updateQuantity(id, diff);
    }
  };

  return (
    <section className={cn("py-16", className)}>
      <div className="container ml-18">
        {/* Header */}
        <div className="flex flex-col gap-6 pb-8 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="flex flex-col gap-4">
            <Logo url="/" className="mb-2">
              <LogoImageDesktop
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblocks-logo.png"
                alt="logo"
                title="Your Store"
              />
              <LogoImageMobile
                src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblocks-logo.png"
                alt="logo"
                title="Your Store"
              />
            </Logo>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Checkout
              </h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Complete your purchase securely
              </p>
            </div>
          </div>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-17.5">
              <div className="space-y-6">
                
                {/* 1. Mode Toggle */}
                <div className="bg-muted/50 p-1 rounded-lg">
                  <Controller
                    name="checkoutMode"
                    control={form.control}
                    render={({ field }) => (
                      <Tabs
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                        className="w-full"
                      >
                        <TabsList className="w-full grid grid-cols-2">
                          <TabsTrigger value="guest">
                            <User className="w-4 h-4 mr-2" /> Guest Checkout
                          </TabsTrigger>
                          <TabsTrigger value="member">
                            <Users className="w-4 h-4 mr-2" /> Gym Member
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    )}
                  />
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  value={activeAccordion}
                  onValueChange={handleOnValueChange}
                >
                  {/* 2. Dynamic Content Based on Mode */}
                  {checkoutMode === "member" ? (
                    <AccordionItem value="section-1">
                      <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline">
                        Select Member
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-7">
                        <div className="space-y-7">
                          <MemberSelectionFields />
                          <Button
                            type="button"
                            className="w-full"
                            variant="secondary"
                            onClick={() => onContinue("section-payment")}
                          >
                            Continue to Payment
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <>
                      <AccordionItem value="section-1">
                        <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline">
                          Contact Information
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-7">
                          <div className="space-y-7">
                            <ContactFields />
                            <Button
                              type="button"
                              className="w-full"
                              variant="secondary"
                              onClick={() => onContinue("section-2")}
                            >
                              Continue
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="section-2">
                        <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline">
                          Address
                        </AccordionTrigger>
                        <AccordionContent className="px-1 pb-7">
                          <div className="space-y-7">
                            <AddressFields />
                            <Button
                              type="button"
                              className="w-full"
                              variant="secondary"
                              onClick={() => onContinue("section-payment")}
                            >
                              Continue
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </>
                  )}

                  {/* 3. Payment Section */}
                  <AccordionItem value="section-payment">
                    <AccordionTrigger className="px-1 py-7 text-lg font-semibold hover:no-underline">
                      Payment
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pb-7">
                      <div className="space-y-7">
                        <PaymentFields isMember={checkoutMode === "member"} />
                        <Button type="submit" className="w-full">
                          {checkoutMode === "member" ? "Create Invoice" : "Complete Order"}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Cart Section */}
              <div>
                <Cart
                  form={form}
                  cartItems={mappedCartItems}
                  onStoreRemove={removeFromCart}
                  onStoreUpdate={handleCheckoutQuantityChange}
                />
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  );
};

// --- SUB-COMPONENTS ---

const MemberSelectionFields = () => {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  
  // State for search results and loading
  const [searchResults, setSearchResults] = useState<MemberResult[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setLoading(true);
        const data = await searchMembers(inputValue);
        setSearchResults(data);
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms delay to prevent database spam while typing

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle selection (When user clicks an item)
  const handleSelect = (member: MemberResult) => {
    form.setValue("memberId", member.biometricId);
    setInputValue(member.fullName); // Show name in box after selection
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Controller
        name="memberId"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="flex flex-col gap-2">
            <FieldLabel>Search Member</FieldLabel>
            
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {/* Logic to show selected member name if ID exists */}
                  {field.value
                    ? (searchResults.find(m => m.biometricId === field.value)?.fullName || field.value)
                    : "Search by Name, Email or ID..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                {/* IMPORTANT: shouldFilter={false} is critical here.
                   It tells ShadCN NOT to filter results locally, 
                   because our Server Action already did the filtering.
                */}
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Type at least 2 characters..." 
                    value={inputValue}
                    onValueChange={setInputValue}
                  />
                  <CommandList>
                    {loading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Searching database...
                        </div>
                    )}
                    
                    {!loading && searchResults.length === 0 && (
                      <CommandEmpty>No member found.</CommandEmpty>
                    )}
                    
                    <CommandGroup>
                      {searchResults.map((member) => (
                        <CommandItem
                          key={member.biometricId}
                          value={String(member.biometricId)} // value matches key for selection
                          onSelect={() => handleSelect(member)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === member.biometricId
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{member.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              ID: {member.biometricId} • {member.email}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      
      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md border">
        <p>
          Selecting a member will connect this invoice to their database record.
        </p>
      </div>
    </div>
  );
};

const ContactFields = () => {
  const form = useFormContext();

  return (
    <FieldGroup className="gap-3.5">
      <Controller
        name="contactInfo.email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-sm font-normal" htmlFor="checkout-email">
              Email
            </FieldLabel>
            <Input {...field} id="checkout-email" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="contactInfo.subscribe"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="checkout-subscribe"
              name={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor="checkout-subscribe" className="font-normal">
              Email me with news and offers
            </FieldLabel>
          </Field>
        )}
      />
    </FieldGroup>
  );
};

const AddressFields = () => {
  const form = useFormContext();

  return (
    <FieldGroup className="gap-3.5">
      <Controller
        name="address.country"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-sm font-normal" htmlFor="checkout-country">
              Country
            </FieldLabel>
            <Input {...field} id="checkout-country" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex gap-3.5 max-sm:flex-col">
        <Controller
          name="address.firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-sm font-normal" htmlFor="checkout-firstName">
                First Name
              </FieldLabel>
              <Input {...field} id="checkout-firstName" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-sm font-normal" htmlFor="checkout-lastName">
                Last Name
              </FieldLabel>
              <Input {...field} id="checkout-lastName" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="address.address"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-sm font-normal" htmlFor="checkout-address">
              Address
            </FieldLabel>
            <Input {...field} id="checkout-address" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="flex gap-3.5 max-sm:flex-col">
        <Controller
          name="address.postalCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-sm font-normal" htmlFor="checkout-postalCode">
                Postal Code
              </FieldLabel>
              <Input {...field} id="checkout-postalCode" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address.city"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-sm font-normal" htmlFor="checkout-city">
                City
              </FieldLabel>
              <Input {...field} id="checkout-city" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      <Controller
        name="address.phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-sm font-normal" htmlFor="checkout-phone">
              Phone
            </FieldLabel>
            <Input {...field} id="checkout-phone" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
};

const PaymentFields = ({ isMember }: { isMember: boolean }) => {
  const form = useFormContext();
  const paymentMethod = form.watch("payment.method") as PaymentMethod;

  return (
    <div className="space-y-7">
      <Controller
        name="payment.method"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              {isMember && (
                <FieldLabel htmlFor="checkout-payment-onAccount">
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <FieldContent className="flex-1">
                      <FieldTitle>Bill to Member Account</FieldTitle>
                      <span className="text-xs text-muted-foreground">Add to monthly invoice</span>
                    </FieldContent>
                    <RadioGroupItem
                      value="onAccount"
                      id="checkout-payment-onAccount"
                      aria-invalid={fieldState.invalid}
                    />
                  </Field>
                </FieldLabel>
              )}
              
              <FieldLabel htmlFor="checkout-payment-creditCard">
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <FieldContent className="flex-1">
                    <FieldTitle>Credit Card</FieldTitle>
                  </FieldContent>
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/visa-icon.svg"
                    alt="Credit Card"
                    className="size-5"
                  />
                  <RadioGroupItem
                    value="creditCard"
                    id="checkout-payment-creditCard"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="checkout-payment-paypal">
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <FieldContent className="flex-1">
                    <FieldTitle>PayPal</FieldTitle>
                  </FieldContent>
                  <img
                    src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/paypal-icon.svg"
                    alt="PayPal"
                    className="size-5"
                  />
                  <RadioGroupItem
                    value="paypal"
                    id="checkout-payment-paypal"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor="checkout-payment-bank">
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldTitle>Online Bank Transfer</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    value="onlineBankTransfer"
                    id="checkout-payment-bank"
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <PaymentFieldsByMethod method={paymentMethod} />
    </div>
  );
};

const PaymentFieldsByMethod = ({ method }: { method: PaymentMethod }) => {
  const form = useFormContext();

  if (!method || method === 'onAccount') return null;

  switch (method) {
    case PAYMENT_METHODS.creditCard:
      return (
        <div className="space-y-3.5">
          <Controller
            name="payment.cardholderName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-cardholderName">
                  Cardholder Name
                </FieldLabel>
                <Input {...field} id="checkout-payment-cardholderName" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="payment.cardNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-cardNumber">
                  Card Number
                </FieldLabel>
                <Input {...field} id="checkout-payment-cardNumber" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <div className="flex gap-3.5 max-sm:flex-col">
            <DateInput />
            <Controller
              name="payment.cvc"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-cvc">
                    CVC
                  </FieldLabel>
                  <Input {...field} id="checkout-payment-cvc" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </div>
      );
    case PAYMENT_METHODS.paypal:
      return (
        <Controller
          name="payment.payPalEmail"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-payPalEmail">
                PayPal Email
              </FieldLabel>
              <Input
                {...field}
                type="email"
                placeholder="you-email-here@email.com"
                id="checkout-payment-payPalEmail"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      );
    case PAYMENT_METHODS.onlineBankTransfer:
      return (
        <div className="space-y-3.5">
          <Controller
            name="payment.bankName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-bankName">
                  Bank Name
                </FieldLabel>
                <Input {...field} placeholder="Bank Name" id="checkout-payment-bankName" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="payment.accountNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-accountNumber">
                  Account Number
                </FieldLabel>
                <Input {...field} id="checkout-payment-accountNumber" aria-invalid={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      );
    default:
      return null;
  }
};

const DateInput = () => {
  const form = useFormContext();

  return (
    <Controller
      name="payment.expiryDate"
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel className="text-sm font-normal" htmlFor="checkout-payment-expiryDate">
            Expiry Date
          </FieldLabel>
          <Input
            {...field}
            onChange={(e) => {
              let val = e.target.value;
              val = val.replace(/[^0-9/]/g, "");
              const prev = field.value ?? "";
              const isDeleting = val.length < prev.length;
              if (!isDeleting) {
                if (val.length === 2 && !val.includes("/")) {
                  val = val + "/";
                }
              }
              if (val.length > 5) {
                val = val.slice(0, 5);
              }
              field.onChange(val);
            }}
            pattern="^(0[1-9]|1[0-2])/[0-9]{2}$"
            placeholder="MM/YY"
            id="checkout-payment-expiryDate"
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const Cart = ({ cartItems, form, onStoreRemove, onStoreUpdate }: ExtendedCartProps) => {
  const { fields } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const formItems = form.watch("products");

  const subTotal = formItems?.reduce((sum, p) => sum + p.price * p.quantity, 0) || 0;
  const taxAmount = subTotal * 0.1;
  const grandTotal = subTotal + taxAmount;
  const currency = cartItems[0]?.price?.currency ?? "USD";

  const handleRemove = useCallback(
    (index: number, productId: number) => () => {
      onStoreRemove(productId);
    },
    [onStoreRemove]
  );

  const handleQuantityChange = useCallback(
    (index: number, productId: number) => (newQty: number) => {
      onStoreUpdate(productId, newQty);
    },
    [onStoreUpdate]
  );

  return (
    <div>
      <div className="border-b py-7">
        <h2 className="text-lg leading-relaxed font-semibold">Your Cart</h2>
      </div>
      <ul className="space-y-12 py-7">
        {fields.map((field, index) => {
          const originalItem = cartItems.find((p) => p.product_id === field.product_id);

          if (!originalItem) return null;

          return (
            <li key={field.id}>
              <CartItem
                {...originalItem}
                onRemoveClick={handleRemove(index, originalItem.product_id)}
                onQuantityChange={handleQuantityChange(index, originalItem.product_id)}
                index={index}
              />
            </li>
          );
        })}
      </ul>
      <div>
        <div className="space-y-3.5 border-y py-7">
          <div className="flex justify-between gap-3">
            <p className="text-sm">Subtotal</p>
            <Price className="text-sm font-normal">
              <PriceValue price={subTotal} currency={currency} variant="regular" />
            </Price>
          </div>
          <div className="flex justify-between gap-3">
            <p className="text-sm">Shipping</p>
            <p className="text-sm">Free</p>
          </div>
          <div className="flex justify-between gap-3">
            <p className="text-sm">Estimated Tax (10%)</p>
            <p className="text-sm">
              {currency === "USD" ? "$" : ""}
              {taxAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="py-7">
          <div className="flex justify-between gap-3">
            <p className="text-lg leading-tight font-medium">Total</p>
            <Price className="text-xl font-medium">
              <PriceValue price={grandTotal} currency={currency} variant="regular" />
            </Price>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({
  image,
  name,
  link,
  details,
  price,
  index,
  onQuantityChange,
  onRemoveClick,
}: CartItemProps) => {
  const { regular, currency } = price;

  return (
    <Card className="rounded-none border-none bg-background p-0 shadow-none">
      <div className="flex w-full gap-3.5 max-sm:flex-col">
        <div className="shrink-0 basis-25">
          <AspectRatio ratio={1} className="overflow-hidden rounded-lg">
            <img src={image} alt={name} className="block size-full object-cover object-center" />
          </AspectRatio>
        </div>
        <div className="flex-1">
          <div className="flex flex-col justify-between gap-3">
            <div className="flex w-full justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  <span>{name}</span>
                </CardTitle>
                <ProductDetails details={details} />
              </div>
              <div>
                <Price className="text-sm font-semibold">
                  <PriceValue price={regular} currency={currency} variant="regular" />
                </Price>
              </div>
            </div>
            <div className="flex w-full justify-between gap-3">
              <QuantityField index={index} onQuantityChange={onQuantityChange} />
              <Button size="icon" variant="ghost" onClick={onRemoveClick} type="button">
                <Trash />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ProductDetails = ({ details }: { details?: { label: string; value: string }[] }) => {
  if (!details || details.length === 0) return null;
  return (
    <ul>
      {details.map((item, index) => {
        const isLast = index === details.length - 1;
        return (
          <li className="inline" key={`product-details-${index}`}>
            <dl className="inline text-xs text-muted-foreground">
              <dt className="inline">{item.label}: </dt>
              <dd className="inline">{item.value}</dd>
              {!isLast && <span className="mx-1 text-muted-foreground">/</span>}
            </dl>
          </li>
        );
      })}
    </ul>
  );
};

const QuantityField = ({ index, onQuantityChange }: { index: number; onQuantityChange: (n: number) => void }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={`products.${index}.quantity`}
      control={control}
      render={({ field }) => {
        return (
          <Field className="w-full max-w-28">
            <QuantityInput
              inputProps={field}
              onValueChange={(newQty) => {
                onQuantityChange(newQty);
              }}
              className="rounded-none"
            />
          </Field>
        );
      }}
    />
  );
};

export default CheckoutPage;