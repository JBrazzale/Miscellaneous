// Calendar Widget with images from unsplash. built on IOS 15
const IMAGE_SOURCE = "Unsplash"
const TERMS = "Nature"

const FORCE_IMAGE_UPDATE = true
const TEST_MODE = false

// Store current (datetime)
const date = new Date()

// Go to calendar when running script
if (!config.runsInWidget && !TEST_MODE) {
  const appleDate = new Date('2001/01/01')
  const timestamp = (date.getTime() - appleDate.getTime()) / 1000
  const callback = new CallbackURL("calshow:"+timestamp)
  callback.open()
  Script.complete()

// Otherwise, create the widget.
} else {

  let widget = new ListWidget()

  // Format the date info
  let df = new DateFormatter()
  df.dateFormat = "EEEE"
  let dayOfWeek = widget.addText(df.string(date).toUpperCase())
  let dateNumber = widget.addText(date.getDate().toString())
  dayOfWeek.font = Font.semiboldSystemFont(12)
  dateNumber.font = Font.lightSystemFont(34)
  dayOfWeek.textColor = Color.white()
  dateNumber.textColor = Color.white()

  // Add future events. (does not work with all day events)
  const events = await CalendarEvent.today([])
  let futureEvents = []
  for (const event of events) {
      if (event.startDate.getTime() > date.getTime() && !event.isAllDay && !event.title.startsWith("Canceled:")) {
          futureEvents.push(event)
      }
  }

  // Look for the image file
  let files = FileManager.local()
  const path = files.documentsDirectory() + "/calendar_widget.jpg"
  const modificationDate = files.modificationDate(path)

  // Download image if it doesn't exist, wasn't created today, or update is forced
  if (!modificationDate || !sameDay(modificationDate,date) || FORCE_IMAGE_UPDATE) {
     try {
        let img = await provideImage(IMAGE_SOURCE,TERMS)
        files.writeImage(path,img)
        widget.backgroundImage = img
     } catch {
        widget.backgroundImage = files.readImage(path)
     }
  } else {
     widget.backgroundImage = files.readImage(path)
  }

  // add today's events
  if (futureEvents.length != 0) {

    widget.addSpacer()

    let titleOne = widget.addText(futureEvents[0].title)
    titleOne.font = Font.mediumSystemFont(12)
    titleOne.textColor = Color.white()

    widget.addSpacer(7)

    let timeOne = widget.addText(formatTime(futureEvents[0].startDate))
    timeOne.font = Font.regularSystemFont(12)
    timeOne.textColor = Color.lightGray()

    // Add bigger overlay
    let gradient = new LinearGradient()
    gradient.colors = [new Color("#000000",0.75), new Color("#000000",0)]
    gradient.locations = [0, 1]
    widget.backgroundGradient = gradient

    // set to show only one event at a time
    if (futureEvents.length > 1) {

        // limit to single line events
        titleOne.lineLimit = 1

        widget.addSpacer(12)

        let titleTwo = widget.addText(futureEvents[1].title)
        titleTwo.font = Font.mediumSystemFont(14)
        titleTwo.textColor = Color.white()
        titleTwo.lineLimit = 1

        widget.addSpacer(7)

        let timeTwo = widget.addText(formatTime(futureEvents[1].startDate))
        timeTwo.font = Font.regularSystemFont(14)
        timeTwo.textColor = Color.white()
        timeTwo.textOpacity = 0.5
    }

  // If there are no future events today
  } else {

      // Add more minimal overlay
      let gradient = new LinearGradient()
      gradient.colors = [new Color("#000000",0.5), new Color("#000000",0)]
      gradient.locations = [0, 0.5]
      widget.backgroundGradient = gradient

      widget.addSpacer()
  }

  // Finalize widget settings
  widget.setPadding(16,16,16,0)
  widget.spacing = -3

  Script.setWidget(widget)
  widget.presentSmall()
  Script.complete()
}

// Helper function to interpret sources and terms
async function provideImage(source,terms) {

    if (source == "Bing") {
        const url = "http://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US"
        const req = new Request(url)
        const json = await req.loadJSON()
        const imgURL = "http://bing.com" + json.images[0].url
        const img = await downloadImage(imgURL)
        const rect = new Rect(-78,0,356,200)
        return cropImage(img, rect)

    } else if (source == "Unsplash") {
        const img = await downloadImage("https://source.unsplash.com/featured/?"+terms)
        return img
    }

}

// Helper function to download images
async function downloadImage(url) {
   const req = new Request(url)
   return await req.loadImage()
}

// Crop image for widget
function cropImage(img,rect) {

    let draw = new DrawContext()
    draw.respectScreenScale = true

    draw.drawImageInRect(img,rect)
    return draw.getImage()
}

// Formats the times under each event
function formatTime(date) {
    let df = new DateFormatter()
    df.useNoDateStyle()
    df.useShortTimeStyle()
    return df.string(date)
}

// Determines if two dates occur on the same day
function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
}
