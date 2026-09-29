// Shape and validation of a credit application, shared by the public form
// and the submission API so both enforce the same rules.

export const ENTITY_TYPES = [
  'Sole Trader',
  'Closed Corporation',
  'Partnership',
  'Private Company',
  'Public Company',
  'Trust',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export interface Contact {
  name: string
  designation: string
  email: string
  phone: string
}

export interface Director {
  fullName: string
  idNumber: string
  interestHolding: string
  position: string
  residentialAddress: string
}

export interface TradeReference {
  companyName: string
  telephone: string
  designation: string
  contactPerson: string
  estMonthlyPurchase: string
}

export const DOCUMENT_KINDS = [
  { id: 'cipc', label: 'CIPC registration documents', required: true },
  { id: 'vat', label: 'Copy of VAT certificate', required: true },
  { id: 'bank', label: 'Cancelled cheque or bank confirmation letter', required: true },
  {
    id: 'ids',
    label: 'Copy of ID of all owners / directors / partners / members (plus resolution if the signatory is not one of them)',
    required: true,
  },
  { id: 'financials', label: 'Audited annual financial statements (if required)', required: false },
  { id: 'purchase_order', label: 'Copy of a purchase order (if applicable)', required: false },
  { id: 'stamp', label: 'Company stamp (photo or scan)', required: false },
] as const
export type DocumentKind = (typeof DOCUMENT_KINDS)[number]['id']

export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 20
export const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']

export interface CreditApplicationInput {
  salesRep: string
  registeredName: string
  tradingName: string
  registrationNumber: string
  vatNumber: string
  physicalAddress: string
  postalAddress: string
  telephone: string
  fax: string
  entityType: EntityType | ''
  dateEstablished: string
  buyerContact: Contact
  notificationsContact: Contact
  accountsContact: Contact
  bankName: string
  bankAccountName: string
  bankAccountNumber: string
  bankBranchCode: string
  bankBranchLocation: string
  creditLimit: string
  directors: Director[]
  tradeReferences: TradeReference[]
  signatoryName: string
  signatoryCapacity: string
  signedDate: string
  signature: string
  acceptTerms: boolean
  acceptSurety: boolean
  acceptCreditCheck: boolean
}

export interface DocumentDeclaration {
  kind: DocumentKind
  name: string
  size: number
  type: string
}

const emptyContact = (): Contact => ({ name: '', designation: '', email: '', phone: '' })
export const emptyDirector = (): Director => ({
  fullName: '',
  idNumber: '',
  interestHolding: '',
  position: '',
  residentialAddress: '',
})
export const emptyTradeReference = (): TradeReference => ({
  companyName: '',
  telephone: '',
  designation: '',
  contactPerson: '',
  estMonthlyPurchase: '',
})

export function emptyApplication(): CreditApplicationInput {
  return {
    salesRep: '',
    registeredName: '',
    tradingName: '',
    registrationNumber: '',
    vatNumber: '',
    physicalAddress: '',
    postalAddress: '',
    telephone: '',
    fax: '',
    entityType: '',
    dateEstablished: '',
    buyerContact: emptyContact(),
    notificationsContact: emptyContact(),
    accountsContact: emptyContact(),
    bankName: '',
    bankAccountName: '',
    bankAccountNumber: '',
    bankBranchCode: '',
    bankBranchLocation: '',
    creditLimit: '',
    directors: [emptyDirector()],
    tradeReferences: [emptyTradeReference(), emptyTradeReference(), emptyTradeReference()],
    signatoryName: '',
    signatoryCapacity: '',
    signedDate: new Date().toISOString().slice(0, 10),
    signature: '',
    acceptTerms: false,
    acceptSurety: false,
    acceptCreditCheck: false,
  }
}

export type FieldErrors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s()-]{6,}$/
const blank = (v: unknown) => typeof v !== 'string' || v.trim() === ''

function requireText(errors: FieldErrors, key: string, value: string, label: string) {
  if (blank(value)) errors[key] = `${label} is required`
}

function checkContact(errors: FieldErrors, prefix: string, c: Contact, required: boolean) {
  const any = !blank(c.name) || !blank(c.email) || !blank(c.phone) || !blank(c.designation)
  if (!required && !any) return
  requireText(errors, `${prefix}.name`, c.name, 'Contact name')
  if (blank(c.email)) errors[`${prefix}.email`] = 'Email is required'
  else if (!EMAIL_RE.test(c.email.trim())) errors[`${prefix}.email`] = 'Enter a valid email address'
  if (blank(c.phone)) errors[`${prefix}.phone`] = 'Phone number is required'
  else if (!PHONE_RE.test(c.phone.trim())) errors[`${prefix}.phone`] = 'Enter a valid phone number'
}

// Steps mirror the wizard so the form can validate one page at a time.
export const STEPS = ['Company', 'Contacts & Banking', 'Owners', 'Trade References', 'Documents & Sign'] as const

export function validateStep(step: number, a: CreditApplicationInput): FieldErrors {
  const e: FieldErrors = {}
  if (step === 0) {
    requireText(e, 'registeredName', a.registeredName, 'Registered company name')
    requireText(e, 'physicalAddress', a.physicalAddress, 'Physical address')
    if (blank(a.telephone)) e.telephone = 'Telephone number is required'
    else if (!PHONE_RE.test(a.telephone.trim())) e.telephone = 'Enter a valid phone number'
    if (!ENTITY_TYPES.includes(a.entityType as EntityType)) e.entityType = 'Select the type of entity'
    if (a.entityType && !['Sole Trader', 'Partnership'].includes(a.entityType)) {
      requireText(e, 'registrationNumber', a.registrationNumber, 'Company registration number')
    }
  }
  if (step === 1) {
    checkContact(e, 'buyerContact', a.buyerContact, true)
    checkContact(e, 'notificationsContact', a.notificationsContact, false)
    checkContact(e, 'accountsContact', a.accountsContact, true)
    requireText(e, 'bankName', a.bankName, 'Bank')
    requireText(e, 'bankAccountName', a.bankAccountName, 'Account name')
    if (blank(a.bankAccountNumber)) e.bankAccountNumber = 'Account number is required'
    else if (!/^\d[\d\s]{4,}$/.test(a.bankAccountNumber.trim())) e.bankAccountNumber = 'Digits only'
    requireText(e, 'bankBranchCode', a.bankBranchCode, 'Branch code')
    if (blank(a.creditLimit)) e.creditLimit = 'Credit limit is required'
    else if (!(Number(a.creditLimit.replace(/[\s,R]/g, '')) > 0)) e.creditLimit = 'Enter an amount in Rand'
  }
  if (step === 2) {
    if (a.directors.length === 0) e.directors = 'Add at least one owner or director'
    a.directors.forEach((d, i) => {
      requireText(e, `directors.${i}.fullName`, d.fullName, 'Full name')
      if (blank(d.idNumber)) e[`directors.${i}.idNumber`] = 'ID number is required'
      else if (!/^[A-Za-z0-9]{6,20}$/.test(d.idNumber.replace(/\s/g, '')))
        e[`directors.${i}.idNumber`] = 'Enter a valid ID or passport number'
      requireText(e, `directors.${i}.residentialAddress`, d.residentialAddress, 'Residential address')
      if (!blank(d.interestHolding)) {
        const pct = Number(d.interestHolding.replace('%', ''))
        if (!(pct >= 0 && pct <= 100)) e[`directors.${i}.interestHolding`] = 'Enter 0–100'
      }
    })
  }
  if (step === 3) {
    a.tradeReferences.forEach((r, i) => {
      const any = Object.values(r).some((v) => !blank(v))
      if (i === 0 || any) {
        requireText(e, `tradeReferences.${i}.companyName`, r.companyName, 'Company name')
        requireText(e, `tradeReferences.${i}.telephone`, r.telephone, 'Telephone number')
        requireText(e, `tradeReferences.${i}.contactPerson`, r.contactPerson, 'Contact person')
      }
    })
  }
  if (step === 4) {
    requireText(e, 'signatoryName', a.signatoryName, 'Signatory name')
    requireText(e, 'signatoryCapacity', a.signatoryCapacity, 'Capacity')
    requireText(e, 'signedDate', a.signedDate, 'Date')
    if (!a.signature.startsWith('data:image/png;base64,')) e.signature = 'Please sign in the box'
    else if (a.signature.length > 400_000) e.signature = 'Signature image is too large — clear and sign again'
    if (!a.acceptTerms) e.acceptTerms = 'You must accept the terms and conditions'
    if (!a.acceptSurety) e.acceptSurety = 'The suretyship must be accepted to apply for credit'
    if (!a.acceptCreditCheck) e.acceptCreditCheck = 'Consent to credit checks is required'
  }
  return e
}

export function validateAll(a: CreditApplicationInput): FieldErrors {
  return STEPS.reduce<FieldErrors>((acc, _, i) => ({ ...acc, ...validateStep(i, a) }), {})
}

export function validateDocuments(docs: DocumentDeclaration[]): string | null {
  if (docs.length > MAX_FILES) return `Upload at most ${MAX_FILES} files`
  for (const d of docs) {
    if (!DOCUMENT_KINDS.some((k) => k.id === d.kind)) return 'Unknown document type'
    if (!ALLOWED_MIME.includes(d.type)) return `${d.name}: only PDF or image files are accepted`
    if (!(d.size > 0) || d.size > MAX_FILE_BYTES) return `${d.name}: files must be under 10 MB`
  }
  return null
}

// Trim every string and cap lengths so the stored JSON stays sane.
export function sanitize(a: CreditApplicationInput): CreditApplicationInput {
  const t = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const contact = (c: Partial<Contact> | undefined): Contact => ({
    name: t(c?.name),
    designation: t(c?.designation),
    email: t(c?.email),
    phone: t(c?.phone, 40),
  })
  return {
    salesRep: t(a.salesRep, 100),
    registeredName: t(a.registeredName),
    tradingName: t(a.tradingName),
    registrationNumber: t(a.registrationNumber, 60),
    vatNumber: t(a.vatNumber, 30),
    physicalAddress: t(a.physicalAddress, 500),
    postalAddress: t(a.postalAddress, 500),
    telephone: t(a.telephone, 40),
    fax: t(a.fax, 40),
    entityType: ENTITY_TYPES.includes(a.entityType as EntityType) ? (a.entityType as EntityType) : '',
    dateEstablished: t(a.dateEstablished, 10),
    buyerContact: contact(a.buyerContact),
    notificationsContact: contact(a.notificationsContact),
    accountsContact: contact(a.accountsContact),
    bankName: t(a.bankName, 100),
    bankAccountName: t(a.bankAccountName),
    bankAccountNumber: t(a.bankAccountNumber, 30),
    bankBranchCode: t(a.bankBranchCode, 20),
    bankBranchLocation: t(a.bankBranchLocation, 100),
    creditLimit: t(a.creditLimit, 30),
    directors: (Array.isArray(a.directors) ? a.directors : []).slice(0, 10).map((d) => ({
      fullName: t(d?.fullName),
      idNumber: t(d?.idNumber, 30),
      interestHolding: t(d?.interestHolding, 10),
      position: t(d?.position, 100),
      residentialAddress: t(d?.residentialAddress, 500),
    })),
    tradeReferences: (Array.isArray(a.tradeReferences) ? a.tradeReferences : [])
      .slice(0, 5)
      .map((r) => ({
        companyName: t(r?.companyName),
        telephone: t(r?.telephone, 40),
        designation: t(r?.designation, 100),
        contactPerson: t(r?.contactPerson),
        estMonthlyPurchase: t(r?.estMonthlyPurchase, 30),
      }))
      .filter((r, i) => i === 0 || Object.values(r).some((v) => v !== '')),
    signatoryName: t(a.signatoryName),
    signatoryCapacity: t(a.signatoryCapacity, 100),
    signedDate: t(a.signedDate, 10),
    signature: typeof a.signature === 'string' ? a.signature : '',
    acceptTerms: a.acceptTerms === true,
    acceptSurety: a.acceptSurety === true,
    acceptCreditCheck: a.acceptCreditCheck === true,
  }
}
