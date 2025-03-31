import { Disclosure as HeadlessDisclosure, Menu as HeadlessMenu } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import config from '../config/index.json'

// Updated downloadItems to use real document files
const downloadItems = [
  { name: 'Dizajn manuál', fileName: 'Dizajn-manuál.pdf' },
  { name: 'Narodnostný zákon', fileName: 'Narodnostny-zakon.pdf' },
  { name: 'Program rozvoja', fileName: 'Narodnostny-zakon.pdf' },
  { name: 'Rusynska symbolika', fileName: 'Rusynska symbolika.pdf' },
  { name: 'Symboly', fileName: 'Symboly-subory.zip'},
  { name: 'Hymna', fileName: 'Hymna.mp3'},
  { name: 'Príručka o jazykových právach', fileName: 'Language-guide_Ruthenian-in-Slovakia.pdf' },
  { name: 'Štatút Radu Adolfa Dobrianskeho', fileName: 'Štatút Radu Adolfa Dobrianskeho.pdf' },
]

const navigation = config.navigation.map(item => ({
  ...item,
  href: `#${item.href}`,
  current: false
}))

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  const targetId = e.currentTarget.getAttribute('href')?.slice(1);
  const element = document.getElementById(targetId || '');
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};

// Add a function to handle document downloads
const handleDocumentDownload = (e: React.MouseEvent<HTMLAnchorElement>, fileName: string) => {
  e.preventDefault();
  const filePath = `/assets/pdfs/${fileName}`;
  window.open(filePath, '_blank');
};

export default function Navbar() {
  return (
    <HeadlessDisclosure as="nav" 
      className="relative bg-cover bg-center"
      >
      <div className="absolute inset-0 bg-[#0055a1] opacity-85 z-0"></div>
      
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 relative z-10">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <HeadlessDisclosure.Button className="group relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Otvoriť menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </HeadlessDisclosure.Button>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => 
                  item.name === "Na stiahnutie" ? (
                    <HeadlessMenu as="div" key={item.name} className="relative">
                      <HeadlessMenu.Button 
                        className={classNames(
                          'text-white hover:bg-gray-700 hover:text-white',
                          'inline-flex items-center rounded-md px-3 py-2 text-base font-medium'
                        )}
                      >
                        {item.name}
                        <ChevronDownIcon className="ml-1 -mr-1 h-5 w-5" aria-hidden="true" />
                      </HeadlessMenu.Button>
                      <HeadlessMenu.Items
                        className="absolute left-0 z-10 mt-2 w-64 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                      >
                        {downloadItems.map((downloadItem) => (
                          <HeadlessMenu.Item key={downloadItem.name}>
                            {({ active }: { active: boolean }) => (
                              <a
                                href="#"
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleDocumentDownload(e, downloadItem.fileName)}
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                {downloadItem.name}
                              </a>
                            )}
                          </HeadlessMenu.Item>
                        ))}
                      </HeadlessMenu.Items>
                    </HeadlessMenu>
                  ) : (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={scrollToSection}
                      aria-current={item.current ? 'page' : undefined}
                      className={classNames(
                        item.current ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-700 hover:text-white',
                        'rounded-md px-3 py-2 text-base font-medium',
                      )}
                    >
                      {item.name}
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <button
              type="button"
              className="relative rounded-full bg-gray-800 p-1 text-white hover:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button>

            {/* Profile dropdown */}
            <HeadlessMenu as="div" className="relative ml-3">
              <div>
                <HeadlessMenu.Button className="relative flex rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  <img
                    alt=""
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    className="size-8 rounded-full"
                  />
                </HeadlessMenu.Button>
              </div>
              <HeadlessMenu.Items
                transition
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 ring-1 shadow-lg ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
              >
                <HeadlessMenu.Item>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                  >
                    Your Profile
                  </a>
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                  >
                    Settings
                  </a>
                </HeadlessMenu.Item>
                <HeadlessMenu.Item>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                  >
                    Sign out
                  </a>
                </HeadlessMenu.Item>
              </HeadlessMenu.Items>
            </HeadlessMenu>
          </div>
        </div>
      </div>

      <HeadlessDisclosure.Panel className="sm:hidden relative z-10">
        <div className="space-y-1 px-2 pt-2 pb-3">
          {navigation.map((item) => 
            item.name === "Na stiahnutie" ? (
              <div key={item.name}>
                <HeadlessDisclosure.Button
                  as="a"
                  href="#"
                  className={classNames(
                    'text-white hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-lg font-medium'
                  )}
                >
                  {item.name}
                </HeadlessDisclosure.Button>
                <div className="pl-4">
                  {downloadItems.map((downloadItem) => (
                    <HeadlessDisclosure.Button
                      key={downloadItem.name}
                      as="a"
                      href="#"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleDocumentDownload(e, downloadItem.fileName)}
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      {downloadItem.name}
                    </HeadlessDisclosure.Button>
                  ))}
                </div>
              </div>
            ) : (
              <HeadlessDisclosure.Button
                key={item.name}
                as="a"
                href={item.href}
                onClick={scrollToSection}
                aria-current={item.current ? 'page' : undefined}
                className={classNames(
                  item.current ? 'bg-gray-900 text-white' : 'text-white hover:bg-gray-700 hover:text-white',
                  'block rounded-md px-3 py-2 text-lg font-medium',
                )}
              >
                {item.name}
              </HeadlessDisclosure.Button>
            )
          )}
        </div>
      </HeadlessDisclosure.Panel>
    </HeadlessDisclosure>
  )
}
