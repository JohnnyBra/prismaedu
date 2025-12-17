
from playwright.sync_api import sync_playwright

def verify(page):
    page.goto('http://localhost:3020')
    page.wait_for_selector('text=Prisma')
    page.screenshot(path='verification/screenshot.png')

if __name__ == '__main__':
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify(page)
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()
