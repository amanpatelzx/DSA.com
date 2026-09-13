import { judgeRun } from '../apps/api/src/services/judgeService.js';

async function testListNode() {
  console.log('Testing C++ merge-two-sorted-lists:');
  const cpp = await judgeRun({
    language: 'cpp',
    slug: 'merge-two-sorted-lists',
    code: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* tail = &dummy;
        while (list1 && list2) {
            if (list1->val < list2->val) {
                tail->next = list1;
                list1 = list1->next;
            } else {
                tail->next = list2;
                list2 = list2->next;
            }
            tail = tail->next;
        }
        tail->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`,
    testcases: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', expected: '[1,1,2,3,4,4]' }]
  });
  console.log('C++ merge lists:', cpp.status, cpp.cases[0]?.output);

  console.log('Testing Python merge-two-sorted-lists:');
  const py = await judgeRun({
    language: 'python',
    slug: 'merge-two-sorted-lists',
    code: `class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        tail = dummy
        while list1 and list2:
            if list1.val < list2.val:
                tail.next = list1
                list1 = list1.next
            else:
                tail.next = list2
                list2 = list2.next
            tail = tail.next
        tail.next = list1 if list1 else list2
        return dummy.next
`,
    testcases: [{ input: 'list1 = [1,2,4], list2 = [1,3,4]', expected: '[1,1,2,3,4,4]' }]
  });
  console.log('Python merge lists:', py.status, py.cases[0]?.output, py.cases[0]?.error);
}

testListNode().catch(console.error);
