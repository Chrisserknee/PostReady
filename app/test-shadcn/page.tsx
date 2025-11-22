import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ShadcnTestPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-background text-foreground">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Shadcn UI Component Showcase</h1>
          <p className="text-muted-foreground">
            It's not just buttons! Here is a collection of components using your current theme.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Example */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your profile information here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" placeholder="PostReady User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="user@example.com" />
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="ghost">Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>

          {/* Interactive Elements Column */}
          <div className="space-y-6">
            
            {/* Dialog/Modal Example */}
            <Card>
              <CardHeader>
                <CardTitle>Interactive Components</CardTitle>
                <CardDescription>Click the triggers below to see overlays.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Delete Account</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Are you absolutely sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">Confirm Delete</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Profile Menu</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="relative h-10 w-10 rounded-full p-0">
                          <Avatar>
                            <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                            <AvatarFallback>PR</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuItem>Subscription</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
