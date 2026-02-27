import React from 'react'
import Modal from '../ui/modal'
import { Volunteer } from '@/lib/types'
import { Badge } from '../ui/badge'
import { Calendar, Mail, MapPin, Star } from 'lucide-react'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

/** Who is viewing: admin = always show all; volunteer_same_project = show personal + skills, no DOB, ignore anonymous; public = respect anonymous. */
export type VolunteerViewerRole = 'admin' | 'volunteer_same_project' | 'public';

interface VolunteerInfoModalProps {
  showAll?: boolean
  volunteer?: Volunteer | null
  /** Viewer context: admin always sees all; volunteer_same_project sees name/email/skills (no DOB), ignores anonymous; public respects anonymous. */
  viewerRole?: VolunteerViewerRole
}

const VolunteerInfoModal = ({ showAll, volunteer, viewerRole = 'public' }: VolunteerInfoModalProps) => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    if (!volunteer) {
    return (
      <Modal id='volunteer-info-modal' isOpen={open} onClose={() => setOpen(false)} onOpen={()=> setOpen(true)}>
        <Modal.Body>
          <Modal.Header>
            <h3 className="text-xl">Volunteer Information</h3>
          </Modal.Header>
          <Modal.Body className="py-12 text-center text-muted-foreground">
            No volunteer selected
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline" onClick={()=> setOpen(false)}>Close</Button>
          </Modal.Footer>
        </Modal.Body>
      </Modal>
    )
  }

  const getInitials = (name: string = "") =>
    name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase() || "?"

  const isAdmin = viewerRole === 'admin';
  const isSameProject = viewerRole === 'volunteer_same_project';
  const isPublic = viewerRole === 'public';
  const hidePersonal = isPublic && volunteer.anonymous === true;

  return (
    <Modal id='volunteer-info-modal' isOpen={open} onClose={() => setOpen(false)} onOpen={()=> setOpen(true)}>
      <div className="w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <Modal.Header className="border-b pb-4">
          <div className="flex items-center gap-4 w-full">
            <Avatar className="h-14 w-14 shrink-0">
              {!hidePersonal && <AvatarImage src={volunteer.avatar_url ?? undefined} alt={volunteer.full_name} />}
              <AvatarFallback className="text-lg">{hidePersonal ? "?" : getInitials(volunteer.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-semibold truncate">{hidePersonal ? "Volunteer" : volunteer.full_name}</h3>
              {volunteer.request_status && (
                <Badge
                  variant={
                    volunteer.request_status === "accepted" ? "default" :
                    volunteer.request_status === "rejected" ? "destructive" : 
                    "secondary"
                  }
                  className="mt-1.5"
                >
                  {volunteer.request_status.charAt(0).toUpperCase() + volunteer.request_status.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="space-y-6 py-6 w-full">
          {/* Contact & Basic Info – 2-col grid to use space */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 w-full">
            {!hidePersonal && volunteer.email && (
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="truncate">{volunteer.email}</span>
              </div>
            )}

            {(volunteer.residence_country || volunteer.residence_state) && (
              <div className="flex items-start gap-3 min-w-0 sm:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  {volunteer.residence_country}
                  {volunteer.residence_state && ` • ${volunteer.residence_state}`}
                </div>
              </div>
            )}

            {volunteer.joined_at && (
              <div className="flex items-center gap-3 min-w-0">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm">
                  Joined {new Date(volunteer.joined_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {volunteer.average_rating !== undefined && (
              <div className="flex items-center gap-3 min-w-0">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="font-medium">
                  {volunteer.average_rating.toFixed(1)} • Rating
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Skills Section */}
          {volunteer.skills?.length > 0 && (
            <div className="w-full">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Key Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {volunteer.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {/*@ts-ignore*/}
          {volunteer.matched_skills?.length > 0 && (
            <>
              <Separator className="my-5" />
              <div className="w-full">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Matched Project Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {/*@ts-ignore*/}
                  {volunteer.matched_skills.map(skill => (
                    <Badge key={skill} className="bg-green-50 text-green-800 border-green-200 hover:bg-green-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional / Admin Info */}
          {showAll && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm w-full">
                <div className="min-w-0">
                  <span className="font-medium text-muted-foreground">Volunteer ID:</span>{' '}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs break-all">
                    {volunteer.volunteer_id}
                  </code>
                </div>
                {volunteer.availability && (
                  <div className="min-w-0">
                    <span className="font-medium text-muted-foreground">Availability:</span>{' '}
                    {volunteer.availability}
                  </div>
                )}
                {volunteer.volunteer_countries?.length ? (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="font-medium text-muted-foreground">Preferred Countries:</span>{' '}
                    {volunteer.volunteer_countries.join(", ")}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer className="border-t pt-4">
          <Button variant="outline" onClick={()=> setOpen(false)}>
            Close
          </Button>
          {/* You can add more actions later */}
          {/* <Button>Send Message</Button> */}
          {/* <Button variant="secondary">View Full Profile</Button> */}
        </Modal.Footer>
      </div>
    </Modal>
)}

export default VolunteerInfoModal
