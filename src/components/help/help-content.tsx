"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  LayoutDashboard,
  Shirt,
  ClipboardList,
  Users,
  Theater,
  Settings,
  Camera,
  Ruler,
  Tag,
  FileText,
  Link2,
  Printer,
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: HelpItem[];
}

interface HelpItem {
  question: string;
  answer: string;
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <LayoutDashboard className="w-5 h-5 text-purple-400" />,
    description: "The basics of navigating and using CostumeTrack",
    items: [
      {
        question: "What is CostumeTrack?",
        answer:
          "CostumeTrack is an inventory management and rental tracking tool built for costume shops, theaters, and costume makers. It helps you keep track of your entire costume collection, manage rentals to customers, organize productions, and more -- all in one place.",
      },
      {
        question: "How do I navigate around the app?",
        answer:
          "Use the sidebar on the left side of your screen to jump between sections. On a phone or tablet, tap the menu icon in the top left corner to open the sidebar. The main sections are: Dashboard (your home base), Inventory (your costumes), Rentals (who has what), Customers (your contact list), Productions (shows and events), and Settings (your account).",
      },
      {
        question: "What does the Dashboard show me?",
        answer:
          "Your Dashboard is the first thing you see when you log in. It gives you a quick snapshot of your shop: how many costumes you have, how many are currently rented out, any overdue rentals that need attention, and recent activity. It also has quick-action buttons at the top to create a new rental or add a new costume without having to navigate away.",
      },
      {
        question: "How do I invite my team members?",
        answer:
          "Go to Settings and you will see a Team Members section showing everyone who has access to your organization. To invite a new team member, share your registration link and invite code with them. They will create their own account and join your organization. Team members can have different roles: Owner (full access), Admin (can manage settings and delete items), or Member (can view and create items).",
      },
    ],
  },
  {
    id: "inventory",
    title: "Managing Your Inventory",
    icon: <Shirt className="w-5 h-5 text-purple-400" />,
    description: "Adding, organizing, and finding your costumes",
    items: [
      {
        question: "How do I add a new costume?",
        answer:
          'Click "Add Costume" on the Inventory page (or use the quick-action button on the Dashboard). Fill in the details -- at minimum, you need a name. You can also add a description, size, color, era/time period, condition rating, storage location, and pricing information. Don\'t worry about filling everything in at once; you can always come back and edit later.',
      },
      {
        question: "How do I add photos of my costumes?",
        answer:
          'When editing a costume, scroll down to the Photos section. Click "Upload Photos" to add images from your device or take a photo with your camera. You can upload multiple photos and organize them by type: Main photo (shown in listings), Alternate views, Feature close-ups, Material details, and Info/reference images. Drag photos to reorder them.',
      },
      {
        question: "What do the different status colors mean?",
        answer:
          "Each costume has a status that tells you its current availability. Green (Available) means the costume is in your shop and ready to rent. Purple (Rented) means it is currently out with a customer. Blue (Reserved) means it is set aside for an upcoming rental. Yellow (Maintenance) means it needs cleaning, repair, or other work before it can go out again. Gray (Retired) means it has been taken out of circulation.",
      },
      {
        question: "What are condition ratings?",
        answer:
          "Condition helps you track the quality of each costume over time. Excellent means like-new or pristine condition. Good means minor wear but fully functional. Fair means visible wear or minor issues. Poor means significant wear or damage. Needs Repair means the costume requires attention before it can be rented out.",
      },
      {
        question: "How do I find a specific costume?",
        answer:
          "Use the search bar at the top of the Inventory page. It searches across the costume name, description, SKU, color, era, location, and notes -- so you can search for things like \"red Victorian\" or \"rack B\" and it will find matching costumes. You can also filter by status (Available, Rented, etc.) and by category.",
      },
      {
        question: "What are categories and how do I use them?",
        answer:
          "Categories help you organize your costumes into groups that make sense for your shop. For example, you might have categories like \"Victorian\", \"Medieval\", \"Contemporary\", \"Sci-Fi\", or \"Accessories\". You can create and manage categories from the Settings page. Each category has a name, optional description, and a color. When adding or editing a costume, you can assign it to a category.",
      },
      {
        question: "Can I print tags or labels for my costumes?",
        answer:
          "Yes. When viewing a costume's detail page, you will see a Print Tag button. This generates a printable label with the costume's name, SKU, and a QR code. You can customize the label size from Settings under Label Formats -- choose from standard sizes or create your own custom dimensions to match your label printer.",
      },
    ],
  },
  {
    id: "rentals",
    title: "Rentals",
    icon: <ClipboardList className="w-5 h-5 text-green-400" />,
    description: "Creating, tracking, and returning costume rentals",
    items: [
      {
        question: "How do I create a new rental?",
        answer:
          'Click "New Rental" from the Dashboard or the Rentals page. You will need to: 1) Select a customer (or create a new one), 2) Optionally link it to a production, 3) Set the checkout date and due date, 4) Search for and add the costumes being rented, and 5) Add any notes. When you save the rental, the selected costumes will automatically be marked as "Rented" in your inventory.',
      },
      {
        question: "How do I return a rental?",
        answer:
          'Go to the Rentals page and click on the rental you want to return. On the rental detail page, click the green "Return Items" button. A confirmation dialog will appear -- confirm the return and all the costumes in that rental will automatically be set back to "Available" in your inventory. The rental status will change to "Returned".',
      },
      {
        question: "How do I know if a rental is overdue?",
        answer:
          "CostumeTrack automatically tracks due dates for you. Overdue rentals are highlighted in red throughout the app -- on your Dashboard, in the Rentals list, and on the rental detail page. The Dashboard shows you a count of overdue items and also shows rentals due within the next week so you can follow up before they become overdue.",
      },
      {
        question: "Can I filter rentals by status?",
        answer:
          "Yes. On the Rentals page, use the status dropdown to filter by Active, Returned, or Cancelled rentals. This makes it easy to see just the rentals that are currently out, or to look back at past rental history.",
      },
      {
        question: "What if a customer damages a costume?",
        answer:
          "When you return a rental, you can update the condition of each costume from its detail page in the Inventory section. If it needs repair, change its status to Maintenance and update the condition rating. Add a note describing the damage for your records. You can move it back to Available once it has been repaired.",
      },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    icon: <Users className="w-5 h-5 text-blue-400" />,
    description: "Managing your customer contacts and portal access",
    items: [
      {
        question: "How do I add a new customer?",
        answer:
          'Go to the Customers page and click "Add Customer." Enter their name (required) and optionally their email, phone, company, address, and any notes. You can also add a customer on-the-fly while creating a rental.',
      },
      {
        question: "How do I find a customer?",
        answer:
          "Use the search bar on the Customers page. It searches by name, email, and company name. The customer list also shows how many active rentals each customer has, making it easy to see who currently has costumes checked out.",
      },
      {
        question: "What is the Customer Portal?",
        answer:
          "The Customer Portal is a special link you can share with a customer that lets them view their own rental history online -- without needing a CostumeTrack account. This is great for customers who want to check what they have rented or look at their past rentals. You can enable or disable the portal for each customer from their detail page.",
      },
      {
        question: "How do I set up the Customer Portal?",
        answer:
          "Open a customer's detail page by clicking on their name in the customer list. Scroll down to the Customer Portal section. Toggle the switch to enable portal access. CostumeTrack will generate a unique link that you can copy and share with your customer. If you ever need to revoke access, simply toggle the switch off or regenerate the link.",
      },
      {
        question: "Can I delete a customer?",
        answer:
          "Customers can only be deleted by admins and owners. If a customer has any active rentals, you will need to return those rentals first before you can delete the customer. This prevents accidentally losing rental records.",
      },
    ],
  },
  {
    id: "productions",
    title: "Productions",
    icon: <Theater className="w-5 h-5 text-orange-400" />,
    description: "Tracking shows, events, and their costume needs",
    items: [
      {
        question: "What are productions used for?",
        answer:
          "Productions represent shows, plays, events, or any occasion where costumes are being used. Linking rentals to a production helps you see all the costumes going to a specific show in one place. Productions also have a Costume Plot feature for planning which character wears what in each scene.",
      },
      {
        question: "How do I create a production?",
        answer:
          'Go to the Productions page and click "Add Production." Enter the production name, and optionally add the venue, director, start and end dates, and any notes. After creating it, you can link rentals to this production.',
      },
      {
        question: "How do I edit a production?",
        answer:
          "Click on a production in the list to open its detail page. Click the Edit button to make changes. You can update the name, venue, director, dates, and notes. Click Save to keep your changes or Cancel to discard them.",
      },
      {
        question: "Can I delete a production?",
        answer:
          "Yes, but only if it has no active rentals linked to it. If there are active rentals, you will need to return them first. Click the Delete button on the production detail page and confirm in the dialog that appears.",
      },
    ],
  },
  {
    id: "costume-plot",
    title: "Costume Plot",
    icon: <Ruler className="w-5 h-5 text-teal-400" />,
    description: "Planning costumes for each character and scene",
    items: [
      {
        question: "What is a Costume Plot?",
        answer:
          "A Costume Plot is a visual planning tool used in theater to map out which costumes each character wears in every scene. It is displayed as a grid with characters on one side and scenes across the top. Each cell shows what costume that character is wearing in that scene. This is a standard tool used by costume designers to plan and communicate costume changes throughout a production.",
      },
      {
        question: "How do I access the Costume Plot?",
        answer:
          'Open a production\'s detail page and click the "Costume Plot" link. This will take you to the full costume plot grid for that production.',
      },
      {
        question: "How do I add characters?",
        answer:
          'On the Costume Plot page, click "Add Character." Enter the character name, optionally the actor playing the role, and a description. Each character becomes a row in the costume plot grid. You can also assign a color to each character for visual organization.',
      },
      {
        question: "How do I add scenes?",
        answer:
          'Click "Add Scene" to create a new column in the grid. Enter the scene name, and optionally the act number and scene number. Scenes become columns in the costume plot grid, arranged in order.',
      },
      {
        question: "How do I assign costumes to scenes?",
        answer:
          "Click on any cell in the grid where a character row and scene column intersect. A search panel will appear where you can search through your inventory. Click on a costume to assign it to that character for that scene. You can assign multiple costumes if a character has quick changes within a scene.",
      },
      {
        question: "How do I record actor measurements?",
        answer:
          'Click the ruler icon next to a character\'s name in the costume plot. This opens the measurements dialog where you can record body measurements like height, weight, chest, waist, hip, inseam, and more. These measurements stay with the character and can be referenced when pulling costumes for fittings.',
      },
      {
        question: "Can I add character sketches?",
        answer:
          "Yes. Each character can have reference sketches or design images attached. Click on a character's name in the costume plot to expand their details, then use the upload area to add sketches. These are great for sharing the costume designer's vision with the build team.",
      },
    ],
  },
  {
    id: "settings",
    title: "Settings & Customization",
    icon: <Settings className="w-5 h-5 text-zinc-400" />,
    description: "Configuring your shop profile, categories, and more",
    items: [
      {
        question: "How do I update my shop profile?",
        answer:
          "Go to Settings and find the Organization Profile section at the top. Here you can update your shop name, description, contact email, phone number, address, website, and logo. You can also enable or disable the public landing page that customers can visit.",
      },
      {
        question: "How do I manage categories?",
        answer:
          'In Settings, find the Categories card. Click "Add" to create a new category. Enter a name, optional description, and choose a color. To edit an existing category, hover over it and click the pencil icon. To delete one, hover and click the trash icon -- any costumes in that category will become uncategorized.',
      },
      {
        question: "How do I set up label printing?",
        answer:
          "In Settings, find the Label Formats card. You will see several standard label sizes pre-configured. Click on a format to set it as your default for printing. If none of the standard sizes match your label printer, click the Custom button to create your own format with exact width and height dimensions.",
      },
      {
        question: "How do I customize the rental agreement?",
        answer:
          "In Settings, find the Rental Agreement section. You can write or edit the agreement text that customers will see when renting costumes. The editor supports basic formatting with Markdown: use # for headings, ** for bold text, * for italic, and - for bullet points. Use the Preview tab to see how it will look. You can also use the default template as a starting point.",
      },
      {
        question: "What are the different user roles?",
        answer:
          "There are three roles in CostumeTrack. Owner: Has full access to everything, including billing and organization management. This is the person who created the account. Admin: Can manage settings, categories, delete items, and manage customer portal access. Great for shop managers or lead costumers. Member: Can view everything and create new items, rentals, and customers, but cannot delete resources or change settings. Good for assistants and team members.",
      },
    ],
  },
  {
    id: "tips",
    title: "Tips & Best Practices",
    icon: <Tag className="w-5 h-5 text-yellow-400" />,
    description: "Get the most out of CostumeTrack",
    items: [
      {
        question: "What is the best way to organize a large inventory?",
        answer:
          "Start by creating categories that make sense for your collection (by era, by type, by show, etc.). Use the location field to track where each costume is physically stored (\"Rack A, Shelf 3\"). Add SKU numbers for easy reference. Take at least one photo of each costume. And keep condition ratings up to date so you always know what is ready to go out.",
      },
      {
        question: "How should I handle costume maintenance?",
        answer:
          "When a costume comes back from a rental and needs cleaning or repair, change its status to Maintenance. Update the condition rating and add a note about what needs to be done. Once it has been cleaned or repaired, move it back to Available and update the condition. This prevents you from accidentally renting out a costume that is not ready.",
      },
      {
        question: "How do I track rental pricing?",
        answer:
          "Each costume has a Purchase Price field (what you paid for it) and a Rental Price field (what you charge to rent it). While CostumeTrack does not process payments, these fields help you track the value of your inventory and set consistent pricing.",
      },
      {
        question: "Can multiple people use CostumeTrack at the same time?",
        answer:
          "Yes. CostumeTrack is built for teams. Multiple people can be logged in and working at the same time. Changes are saved immediately and will appear when other team members refresh their page.",
      },
      {
        question: "How do I use CostumeTrack on my phone?",
        answer:
          "CostumeTrack works on any device with a web browser. On phones and tablets, the layout adjusts automatically to fit your screen. The sidebar becomes a slide-out menu accessible from the top left corner. You can even take costume photos directly from your phone's camera when adding or editing inventory items.",
      },
    ],
  },
];

export function HelpContent() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = searchTerm.trim()
    ? helpSections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0)
    : helpSections;

  const totalResults = filteredSections.reduce(
    (acc, s) => acc + s.items.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search help topics..."
          aria-label="Search help topics"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>

      {searchTerm && (
        <p className="text-sm text-zinc-400">
          {totalResults === 0
            ? "No results found. Try a different search term."
            : `Found ${totalResults} result${totalResults !== 1 ? "s" : ""} in ${filteredSections.length} section${filteredSections.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Sections */}
      {filteredSections.map((section) => (
        <Card key={section.id} className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 flex items-center gap-3 text-base">
              {section.icon}
              {section.title}
            </CardTitle>
            <p className="text-sm text-zinc-500">{section.description}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              {section.items.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`${section.id}-${index}`}
                  className="border-zinc-800"
                >
                  <AccordionTrigger className="text-sm text-zinc-200 hover:text-zinc-100 text-left py-3">
                    {searchTerm ? (
                      <HighlightText
                        text={item.question}
                        highlight={searchTerm}
                      />
                    ) : (
                      item.question
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-zinc-400 leading-relaxed pb-4">
                    {searchTerm ? (
                      <HighlightText
                        text={item.answer}
                        highlight={searchTerm}
                      />
                    ) : (
                      item.answer
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      {/* Contact support */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="py-6">
          <div className="text-center">
            <p className="text-zinc-300 font-medium mb-1">
              Still need help?
            </p>
            <p className="text-sm text-zinc-500">
              If you cannot find the answer you are looking for, reach out to
              us and we will be happy to help.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HighlightText({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-purple-600/30 text-purple-200 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
