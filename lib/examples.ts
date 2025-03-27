export const examples = {
  button: {
    code: `// Define the Preview component
function Preview() {
  // Access Lucide icons
  const { Mail, Loader2 } = LucideIcons;
  
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Button Examples</h2>
      <div className="flex flex-wrap gap-4">
        <Button>Default Button</Button>
        <Button variant="secondary">
          Secondary
        </Button>
        <Button variant="destructive">
          Destructive
        </Button>
        <Button variant="outline">
          Outline
        </Button>
        <Button variant="ghost">
          Ghost
        </Button>
        <Button variant="link">
          Link
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button size="lg">Large</Button>
        <Button>Default</Button>
        <Button size="sm">Small</Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button>
          <Mail className="mr-2 h-4 w-4" /> Login with Email
        </Button>
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
      </div>
    </div>
  );
}`,
  },
  card: {
    code: `// Define the Preview component
function Preview() {
  // Access mock data
  const { user } = mockData;
  
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Profile Card</CardTitle>
        <p className="text-sm text-muted-foreground">
          View and manage your profile information
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div className="grid gap-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" defaultValue={user.bio} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" defaultValue={user.location} />
          </div>
        </div>
        <div className="flex justify-between mt-6">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}`,
  },
  form: {
    code: `// Define the Preview component
function Preview() {
  // Define products array directly in the component
  const items = [
    { id: 'product-1', name: 'Awesome T-Shirt', price: '$25.00' },
    { id: 'product-2', name: 'Cool Coffee Mug', price: '$15.00' },
  ];
  
  // Pre-calculate the total price to avoid any scope issues
  const priceSum = items.reduce((total, item) => {
    const price = parseFloat(item.price.replace('$', ''));
    return total + price;
  }, 0);
  
  const totalPrice = priceSum.toFixed(2);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Product Checkout</h2>
        <p className="text-muted-foreground">Complete your purchase</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Your Items</h3>
        <div className="border rounded-lg divide-y">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Checkbox id={item.id} />
                <Label htmlFor={item.id}>{item.name}</Label>
              </div>
              <div className="font-medium">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium">Payment Details</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name on card</Label>
            <Input id="name" placeholder="John Smith" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="card">Card number</Label>
            <Input id="card" placeholder="1234 5678 9012 3456" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input id="expiry" placeholder="MM/YY" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" placeholder="123" />
            </div>
          </div>
        </div>
      </div>
      
      <Button className="w-full">
        Pay ${"${totalPrice}"}
      </Button>
    </div>
  );
}`,
  },
}

